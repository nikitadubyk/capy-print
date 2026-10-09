import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import bridge from "@vkontakte/vk-bridge";
import { vkAdapter } from "@/lib/mini-app/vk";
import {
  getVkMessagingConfig,
  isVkMessagesAllowed,
  sendVkMessage,
  VkMessagingError,
} from "@/lib/vk";
import {
  formatCustomerStatusMessage,
  sendCustomerStatusNotification,
  vkNotificationRandomId,
} from "@/lib/notifications";

test("VK messages: permission, transport failures and platform routing without network", async (t) => {
  const previous = {
    id: process.env.VK_GROUP_ID,
    token: process.env.VK_GROUP_TOKEN,
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  };
  t.after(() => {
    if (previous.id === undefined) delete process.env.VK_GROUP_ID;
    else process.env.VK_GROUP_ID = previous.id;
    if (previous.token === undefined) delete process.env.VK_GROUP_TOKEN;
    else process.env.VK_GROUP_TOKEN = previous.token;
    if (previous.telegramToken === undefined)
      delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previous.telegramToken;
  });
  process.env.VK_GROUP_ID = "123";
  process.env.VK_GROUP_TOKEN = "test-community-token";
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  process.env.VK_GROUP_ID = "123_15";
  assert.equal(getVkMessagingConfig(), null); // A copied post identifier is not a community ID.
  process.env.VK_GROUP_ID = "123";
  const send = t.mock.method(
    axios,
    "post",
    async (): Promise<{ data: unknown }> => ({
      data: { response: { is_allowed: 1 } },
    })
  );
  const log = t.mock.method(console, "error", () => {});
  const order = {
    id: 11,
    status: "COMPLETED" as const,
    updatedAt: new Date("2026-10-09T10:00:00Z"),
    user: {
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
  assert.equal(await isVkMessagesAllowed("42"), true);
  const permissionCall = send.mock.calls[0].arguments as unknown as [
    string,
    URLSearchParams,
    { headers: { Authorization: string }; timeout: number },
  ];
  assert.match(permissionCall[0], /messages.isMessagesFromGroupAllowed$/);
  assert.equal(permissionCall[1].get("user_id"), "42");
  assert.equal(permissionCall[1].get("group_id"), "123");
  assert.equal(permissionCall[1].get("access_token"), null);
  assert.equal(
    permissionCall[2].headers.Authorization,
    "Bearer test-community-token"
  );
  assert.equal(permissionCall[2].timeout, 10_000);

  for (const vkMessagesEnabled of [false, null]) {
    const calls = send.mock.callCount();
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
    assert.equal(send.mock.callCount(), calls);
  }

  send.mock.mockImplementation(async () => ({
    data: { response: { is_allowed: 0 } },
  }));
  let calls = send.mock.callCount();
  assert.equal(await sendCustomerStatusNotification(order), "denied");
  assert.equal(send.mock.callCount(), calls + 1);

  send.mock.mockImplementation(async (...args: unknown[]) => ({
    data: {
      response: String(args[0]).endsWith("messages.send")
        ? 901
        : { is_allowed: 1 },
    },
  }));
  assert.equal(await sendCustomerStatusNotification(order), "sent");
  const params = send.mock.calls.at(-1)
    ?.arguments[1] as unknown as URLSearchParams;
  assert.equal(params.get("user_id"), "42");
  assert.match(params.get("message")!, /Заказ|заказ/);
  assert.doesNotMatch(params.get("message")!, /<b>/);
  assert.equal(Number(params.get("random_id")), vkNotificationRandomId(order));
  assert.equal(
    vkNotificationRandomId(order),
    vkNotificationRandomId({ ...order })
  );
  assert.notEqual(
    vkNotificationRandomId(order),
    vkNotificationRandomId({
      ...order,
      updatedAt: new Date("2026-10-09T10:00:01Z"),
    })
  );

  // A revoked permission is checked again before every delivery.
  send.mock.mockImplementation(async () => ({
    data: { response: { is_allowed: 0 } },
  }));
  calls = send.mock.callCount();
  assert.equal(await sendCustomerStatusNotification(order), "denied");
  assert.equal(send.mock.callCount(), calls + 1);

  for (const code of [901, 5, 6]) {
    send.mock.mockImplementation(async () => ({
      data: {
        error: {
          error_code: code,
          request_params: [{ value: "test-community-token" }],
        },
      },
    }));
    await assert.rejects(
      isVkMessagesAllowed("42"),
      (error: unknown) =>
        error instanceof VkMessagingError && error.code === code
    );
    assert.equal(await sendCustomerStatusNotification(order), "failed");
  }
  send.mock.mockImplementation(async () => {
    throw new Error("secret axios request config");
  });
  assert.equal(await sendCustomerStatusNotification(order), "failed");
  assert.doesNotMatch(
    JSON.stringify(log.mock.calls),
    /test-community-token|secret axios/
  );
  send.mock.mockImplementation(async () => ({ data: { response: {} } }));
  await assert.rejects(isVkMessagesAllowed("42"), VkMessagingError);
  await assert.rejects(sendVkMessage("42", "test", 1), VkMessagingError);

  send.mock.mockImplementation(async () => ({ data: { ok: true } }));
  assert.equal(
    await sendCustomerStatusNotification({
      ...order,
      user: { telegramId: BigInt(42) },
    }),
    "sent"
  );
  assert.match(
    String(send.mock.calls.at(-1)?.arguments[0]),
    /api.telegram.org/
  );
  assert.match(formatCustomerStatusMessage(11, "PRINTING", "telegram")!, /<b>/);
  assert.match(formatCustomerStatusMessage(11, "CANCELLED", "vk")!, /отменен/);
  calls = send.mock.callCount();
  assert.equal(
    await sendCustomerStatusNotification({ ...order, status: "PENDING" }),
    "skipped"
  );
  assert.equal(send.mock.callCount(), calls);
  process.env.VK_GROUP_ID = "-123";
  assert.equal(getVkMessagingConfig(), null);
  assert.equal(await sendCustomerStatusNotification(order), "unconfigured");
  assert.equal(send.mock.callCount(), calls);
});

test("VK Bridge permission is requested explicitly for the configured community", async (t) => {
  const supports = t.mock.method(bridge, "supportsAsync", async () => true);
  const send = t.mock.method(bridge, "send", (async () => ({
    result: true,
  })) as typeof bridge.send);
  assert.equal(await vkAdapter.allowMessagesFromGroup!(123), true);
  assert.deepEqual(send.mock.calls[0].arguments, [
    "VKWebAppAllowMessagesFromGroup",
    { group_id: 123 },
  ]);
  send.mock.mockImplementation((async () => ({
    result: false,
  })) as typeof bridge.send);
  assert.equal(await vkAdapter.allowMessagesFromGroup!(123), false);
  send.mock.mockImplementation((async () => {
    throw new Error("User denied");
  }) as typeof bridge.send);
  await assert.rejects(vkAdapter.allowMessagesFromGroup!(123));
  supports.mock.mockImplementation(async () => false);
  const calls = send.mock.callCount();
  await assert.rejects(
    vkAdapter.allowMessagesFromGroup!(123),
    /не поддерживается/
  );
  assert.equal(send.mock.callCount(), calls);
});
