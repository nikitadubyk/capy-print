import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { getVkAdminPeerIds } from "@/config/vk-server";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  sendOrderNotification,
  formatOrderNotification,
  vkStaffNotificationRandomId,
} from "@/lib/order-notifications";
import {
  notificationOrder as order,
  installNotificationEnv,
} from "./order-notification-fixture";

test("VK staff destinations are full peer IDs, trim whitespace and remove duplicates", (t) => {
  installNotificationEnv(t, {
    VK_ADMIN_PEER_IDS: " 42, 43,42, ,2000000007,-123 ",
  });
  assert.deepEqual(getVkAdminPeerIds(), [42, 43, 2000000007, -123]);
  for (const invalid of [
    "42,url",
    "42,0",
    "9007199254740993",
    "42_15",
    "0x2a",
    "1e3",
    "https://vk.ru/id42",
  ]) {
    process.env.VK_ADMIN_PEER_IDS = invalid;
    assert.equal(getVkAdminPeerIds(), null);
  }
  process.env.VK_ADMIN_PEER_IDS = "";
  assert.deepEqual(getVkAdminPeerIds(), []);
});

test("one template preserves every order field, file URL and customer link for VK", () => {
  const scheduled = { ...order, deadlineAt: "2026-10-09T12:30:00Z" };
  const telegram = formatOrderNotification(scheduled);
  const vk = formatOrderNotification(scheduled, "vk");
  // Model the information in Telegram's formatted text, including its link destinations.
  const rendered = telegram
    .replace(/<a href="([^"]*)">(.*?)<\/a>/g, "$2: $1")
    .replace(/<\/?b>/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
  assert.equal(vk, rendered);
  assert.match(vk, /договор <&>.pdf: https:\/\/example.test\/file\?a=1&b=2/);
  assert.match(vk, /Комментарий: <b>Не теги<\/b>/);
  assert.match(vk, /⏰ Дедлайн:/);
  assert.doesNotMatch(vk, /<a href=/);
});

test("new orders always reach Telegram and all configured VK peers without customer consent lookup", async (t) => {
  installNotificationEnv(t, { VK_ADMIN_PEER_IDS: "42,43,42" });
  const send = t.mock.method(axios, "post", async (url: string) => ({
    data: url.includes("api.telegram.org") ? { ok: true } : { response: 901 },
  }));
  const result = await sendOrderNotification({
    ...order,
    user: {
      ...order.user,
      identities: order.user.identities?.map((identity) => ({
        ...identity,
        vkMessagesEnabled: false,
      })),
    },
  });
  assert.deepEqual(result, {
    telegram: "sent",
    vk: [
      { peerId: 42, result: "sent" },
      { peerId: 43, result: "sent" },
    ],
  });
  assert.equal(send.mock.callCount(), 3);
  const [telegram, ...vk] = send.mock.calls.map(
    (call) => call.arguments as unknown as [string, any, any]
  );
  assert.equal(telegram[1].parse_mode, "HTML");
  assert.equal(telegram[2].timeout, 10_000);
  assert.equal(telegram[1].text, formatOrderNotification(order));
  for (let index = 0; index < vk.length; index++) {
    assert.match(vk[index][0], /messages.send$/);
    const params = vk[index][1] as URLSearchParams;
    assert.equal(params.get("peer_id"), String(42 + index));
    assert.equal(params.get("user_id"), null);
    assert.equal(params.get("message"), formatOrderNotification(order, "vk"));
    assert.equal(
      Number(params.get("random_id")),
      vkStaffNotificationRandomId(order, 42 + index)
    );
    assert.equal(
      vk[index][2].headers.Authorization,
      "Bearer test-community-token"
    );
  }
});

test("a pending/failing Telegram request does not delay starting either VK delivery", async (t) => {
  installNotificationEnv(t);
  const telegram = Promise.withResolvers<void>();
  let deliveredVk = 0;
  const log = t.mock.method(console, "error", () => {});
  t.mock.method(axios, "post", async (url: string) => {
    if (url.includes("api.telegram.org")) {
      await telegram.promise;
      throw new axios.AxiosError(
        "private order and token in raw error",
        "ENOTFOUND"
      );
    }
    deliveredVk++;
    return { data: { response: 901 } };
  });
  const pending = sendOrderNotification(order);
  assert.equal(deliveredVk, 2);
  telegram.resolve();
  assert.deepEqual(await pending, {
    telegram: "failed",
    vk: [
      { peerId: 42, result: "sent" },
      { peerId: 43, result: "sent" },
    ],
  });
  const diagnostics = log.mock.calls[0].arguments[1];
  assert.deepEqual(diagnostics, {
    status: null,
    code: "ENOTFOUND",
    apiErrorCode: null,
    reason: "unknown",
  });
  assert.doesNotMatch(
    JSON.stringify(log.mock.calls),
    /test-bot-token|private order|raw error/
  );
});

test("one denied VK peer cannot cancel Telegram or another VK peer; IDs remain stable on retry", async (t) => {
  installNotificationEnv(t);
  const log = t.mock.method(console, "error", () => {});
  t.mock.method(axios, "post", async (url: string, params: unknown) => ({
    data: url.includes("api.telegram.org")
      ? { ok: true }
      : (params as URLSearchParams).get("peer_id") === "42"
        ? { error: { error_code: 901 } }
        : { response: 902 },
  }));
  assert.deepEqual(await sendOrderNotification(order), {
    telegram: "sent",
    vk: [
      { peerId: 42, result: "failed" },
      { peerId: 43, result: "sent" },
    ],
  });
  assert.deepEqual(log.mock.calls[0].arguments[1], {
    orderId: 62,
    peerId: 42,
    code: 901,
  });
  assert.equal(
    vkStaffNotificationRandomId(order, 42),
    vkStaffNotificationRandomId({ ...order }, 42)
  );
  assert.notEqual(
    vkStaffNotificationRandomId(order, 42),
    vkStaffNotificationRandomId(order, 43)
  );
  assert.notEqual(
    vkStaffNotificationRandomId(order, 42),
    vkStaffNotificationRandomId({ ...order, id: 63 }, 42)
  );
});

test("invalid/unset VK configuration leaves Telegram delivery working; missing Telegram leaves VK working", async (t) => {
  installNotificationEnv(t, { VK_ADMIN_PEER_IDS: "42,bad" });
  t.mock.method(console, "error", () => {});
  const send = t.mock.method(axios, "post", async (url: string) => ({
    data: url.includes("api.telegram.org") ? { ok: true } : { response: 901 },
  }));
  assert.deepEqual(await sendOrderNotification(order), {
    telegram: "sent",
    vk: [],
  });
  assert.equal(send.mock.callCount(), 1);
  process.env.VK_ADMIN_PEER_IDS = "42,43";
  delete process.env.VK_GROUP_TOKEN;
  assert.deepEqual(await sendOrderNotification(order), {
    telegram: "sent",
    vk: [
      { peerId: 42, result: "unconfigured" },
      { peerId: 43, result: "unconfigured" },
    ],
  });
  assert.equal(send.mock.callCount(), 2);
  process.env.VK_GROUP_TOKEN = "test-community-token";
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.deepEqual(await sendOrderNotification(order), {
    telegram: "unconfigured",
    vk: [
      { peerId: 42, result: "sent" },
      { peerId: 43, result: "sent" },
    ],
  });
  process.env.VK_ADMIN_PEER_IDS = "";
  assert.deepEqual(await sendOrderNotification(order), {
    telegram: "unconfigured",
    vk: [],
  });
});

test("Telegram diagnostics distinguish safe API failures and retain neither credentials nor raw descriptions", async (t) => {
  installNotificationEnv(t);
  const log = t.mock.method(console, "error", () => {});
  const send = t.mock.method(axios, "post", async () => ({
    data: {
      ok: false,
      error_code: 400,
      description:
        "Bad Request: can't parse entities test-bot-token private-file-name",
    },
  }));
  assert.equal(
    await sendTelegramMessage({ text: "test", chatId: "test-admin" }),
    false
  );
  assert.deepEqual(log.mock.calls[0].arguments[1], {
    apiErrorCode: 400,
    reason: "invalid_markup",
  });
  send.mock.mockImplementation(async () => {
    throw new Error("secret message with test-bot-token");
  });
  assert.equal(
    await sendTelegramMessage({ text: "test", chatId: "test-admin" }),
    false
  );
  assert.equal(log.mock.calls.at(-1)?.arguments[1].code, "unknown");
  assert.doesNotMatch(
    JSON.stringify(log.mock.calls),
    /test-bot-token|private-file-name|secret message/
  );
});
