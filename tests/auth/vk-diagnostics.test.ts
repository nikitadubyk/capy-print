import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import axios from "axios";
import {
  sendCustomerStatusNotification,
  vkNotificationRandomId,
} from "@/lib/notifications";
import { installNotificationEnv } from "./order-notification-fixture";

const order = {
  id: 11,
  status: "CANCELLED" as const,
  updatedAt: new Date("2026-10-15T10:00:00Z"),
  cancellationReason: "private-cancellation-reason",
  user: {
    id: 7,
    telegramId: null,
    identities: [
      {
        provider: "VK" as const,
        externalUserId: "42",
        vkMessagesEnabled: true,
      },
    ],
  },
};

const setup = (t: TestContext) => {
  installNotificationEnv(t, { VK_GROUP_ID: "123" });
  const entries: Record<string, unknown>[] = [];
  for (const level of ["info", "warn", "error"] as const)
    t.mock.method(console, level, (prefix: unknown, value?: unknown) => {
      assert.equal(prefix, "[Capy Print][vk]");
      entries.push({ ...JSON.parse(String(value)), level });
    });
  t.after(() =>
    assert.doesNotMatch(
      JSON.stringify(entries),
      /test-community-token|private-cancellation-reason|secret-request|Authorization|request_params|error_msg/
    )
  );
  return entries;
};

test("VK diagnostics distinguish declined, missing and revoked consent without sending", async (t) => {
  const entries = setup(t);
  const send = t.mock.method(axios, "post", async () => ({
    data: { response: { is_allowed: 0 } },
  }));
  for (const vkMessagesEnabled of [false, null, undefined]) {
    assert.equal(
      await sendCustomerStatusNotification({
        ...order,
        user: {
          ...order.user,
          identities: [{ ...order.user.identities[0], vkMessagesEnabled }],
        },
      }),
      "denied"
    );
    const entry = entries.at(-1)!;
    assert.equal(entry.event, "status.denied");
    assert.equal(entry.vkMessagesEnabled, vkMessagesEnabled ?? null);
    assert.match(
      String(entry.reason),
      vkMessagesEnabled === false ? /выключил/ : /не сохранено/
    );
    assert.equal(entry.externalUserId, "42");
    assert.equal(entry.userId, 7);
    assert.equal(entry.orderId, 11);
    assert.equal(entry.groupId, 123);
  }
  assert.equal(send.mock.callCount(), 0);
  assert.equal(await sendCustomerStatusNotification(order), "denied");
  assert.equal(send.mock.callCount(), 1);
  assert.equal(entries.at(-1)?.event, "status.permission_checked");
  assert.equal(entries.at(-1)?.allowed, false);
  assert.equal(entries.at(-1)?.result, "denied");
});

test("VK diagnostics correlate acceptance with order, recipient, saved transition and message ID", async (t) => {
  const entries = setup(t);
  const send = t.mock.method(axios, "post", async (url: string) => ({
    status: 200,
    data: {
      response: url.endsWith("messages.send") ? 12345 : { is_allowed: 1 },
    },
  }));
  assert.equal(await sendCustomerStatusNotification(order), "sent");
  assert.equal(send.mock.callCount(), 2);
  assert.deepEqual(
    entries.map((entry) => entry.event),
    [
      "status.started",
      "status.permission_checked",
      "status.sending",
      "status.sent",
    ]
  );
  const sent = entries.at(-1)!;
  assert.equal(sent.messageId, 12345);
  assert.equal(sent.randomId, vkNotificationRandomId(order));
  assert.equal(sent.transitionAt, order.updatedAt.toISOString());
  assert.equal(sent.result, "sent");
  assert.equal(sent.externalUserId, "42");
  assert.equal(sent.userId, 7);
  assert.equal(sent.orderId, 11);
  assert.ok(Number(sent.durationMs) >= 0);
});

test("VK diagnostics retain API error codes at both stages and discard raw VK payloads", async (t) => {
  const entries = setup(t);
  const send = t.mock.method(
    axios,
    "post",
    async (url: string): Promise<{ status: number; data: unknown }> => ({
      status: 200,
      data: { url },
    })
  );
  for (const stage of ["permission_check", "send_message"]) {
    for (const code of [900, 901, 902, 5, 6, 27, 99999]) {
      send.mock.mockImplementation(async (url: string) => ({
        status: 200,
        data:
          stage === "send_message" && !url.endsWith("messages.send")
            ? { response: { is_allowed: 1 } }
            : {
                error: {
                  error_code: code,
                  error_msg: "test-community-token secret-request",
                  request_params: [{ value: "test-community-token" }],
                },
              },
      }));
      assert.equal(await sendCustomerStatusNotification(order), "failed");
      const failed = entries.at(-1)!;
      assert.equal(failed.event, "status.failed");
      assert.equal(failed.level, "error");
      assert.equal(failed.stage, stage);
      assert.equal(failed.code, code);
      assert.equal(failed.httpStatus, 200);
      assert.equal(
        failed.method,
        stage === "send_message"
          ? "messages.send"
          : "messages.isMessagesFromGroupAllowed"
      );
      assert.equal(typeof failed.reason, "string");
      assert.ok(Number(failed.requestDurationMs) >= 0);
    }
  }
});

test("VK diagnostics distinguish timeout, DNS, HTTP and API errors on non-2xx without leaking Axios config", async (t) => {
  const entries = setup(t);
  const send = t.mock.method(axios, "post", async (): Promise<never> => {
    throw new Error("secret-request");
  });
  const cases = [
    {
      transportCode: "ECONNABORTED",
      httpStatus: undefined,
      data: undefined,
      code: "network",
    },
    {
      transportCode: "ENOTFOUND",
      httpStatus: undefined,
      data: undefined,
      code: "network",
    },
    {
      transportCode: "ECONNRESET",
      httpStatus: undefined,
      data: undefined,
      code: "network",
    },
    {
      transportCode: "ERR_BAD_RESPONSE",
      httpStatus: 503,
      data: "secret-request",
      code: "network",
    },
    {
      transportCode: "ERR_BAD_REQUEST",
      httpStatus: 403,
      data: { error: { error_code: 7, error_msg: "secret-request" } },
      code: 7,
    },
    {
      transportCode: "test-community-token",
      httpStatus: 502,
      data: {},
      code: "network",
    },
  ];
  for (const sample of cases) {
    send.mock.mockImplementation(async () => {
      throw Object.assign(
        new axios.AxiosError("secret-request", sample.transportCode),
        {
          config: { headers: { Authorization: "Bearer test-community-token" } },
          response: { status: sample.httpStatus, data: sample.data },
        }
      );
    });
    assert.equal(await sendCustomerStatusNotification(order), "failed");
    const failed = entries.at(-1)!;
    assert.equal(failed.stage, "permission_check");
    assert.equal(failed.code, sample.code);
    assert.equal(failed.httpStatus, sample.httpStatus);
    assert.equal(
      failed.transportCode,
      sample.transportCode === "test-community-token"
        ? "unknown"
        : sample.transportCode
    );
  }
  send.mock.mockImplementation(async () => {
    throw new Error("secret-request test-community-token");
  });
  assert.equal(await sendCustomerStatusNotification(order), "failed");
  assert.equal(entries.at(-1)?.transportCode, "unknown");
});

test("VK diagnostics identify malformed responses, invalid recipients and missing configuration", async (t) => {
  const entries = setup(t);
  const send = t.mock.method(
    axios,
    "post",
    async (url: string): Promise<{ data: unknown }> => ({
      data: { response: {}, url },
    })
  );
  assert.equal(await sendCustomerStatusNotification(order), "failed");
  assert.equal(entries.at(-1)?.code, "response");
  assert.equal(entries.at(-1)?.method, "messages.isMessagesFromGroupAllowed");
  send.mock.mockImplementation(async (url: string) => ({
    data: {
      response: url.endsWith("messages.send")
        ? "unexpected"
        : { is_allowed: 1 },
    },
  }));
  assert.equal(await sendCustomerStatusNotification(order), "failed");
  assert.equal(entries.at(-1)?.code, "response");
  assert.equal(entries.at(-1)?.method, "messages.send");
  const calls = send.mock.callCount();
  assert.equal(
    await sendCustomerStatusNotification({
      ...order,
      user: {
        ...order.user,
        identities: [
          { ...order.user.identities[0], externalUserId: "invalid" },
        ],
      },
    }),
    "failed"
  );
  assert.equal(entries.at(-1)?.code, "recipient");
  assert.equal(send.mock.callCount(), calls);
  delete process.env.VK_GROUP_TOKEN;
  assert.equal(await sendCustomerStatusNotification(order), "unconfigured");
  assert.equal(entries.at(-1)?.groupTokenConfigured, false);
  assert.equal(entries.at(-1)?.groupIdConfigured, true);
  assert.equal(entries.at(-1)?.event, "status.unconfigured");
  process.env.VK_GROUP_TOKEN = "test-community-token";
  process.env.VK_GROUP_ID = "invalid";
  assert.equal(await sendCustomerStatusNotification(order), "unconfigured");
  assert.equal(entries.at(-1)?.groupIdConfigured, false);
  assert.equal(entries.at(-1)?.groupId, null);
  assert.equal(send.mock.callCount(), calls);
});
