import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import {
  formatOrderNotification,
  sendOrderNotification,
} from "@/lib/order-notifications";
import { installNotificationEnv } from "./order-notification-fixture";
import { Urgency, type Order } from "@/types";

const order: Order = {
  id: 62,
  status: "PENDING",
  urgency: Urgency.ASAP,
  createdAt: new Date("2026-10-08T15:26:00Z"),
  user: {
    id: 6,
    telegramId: null,
    firstName: "Анна <&>",
    lastName: "Иванова",
    username: null,
    identities: [{ provider: "VK", externalUserId: "516072459" }],
  },
  comment: "<b>Не теги</b>",
  printJobs: [
    {
      id: 1,
      copies: 1,
      isColor: false,
      duplex: false,
      paperSize: "A4Basic",
      files: [
        {
          id: 1,
          fileUrl: "https://example.test/file?a=1&b=2",
          fileName: "договор <&>.pdf",
          fileSize: 42,
        },
      ],
    },
  ],
};

test("VK notification contains identity, platform and contact links and escapes display metadata", () => {
  const message = formatOrderNotification(order);
  assert.match(message, /Анна &lt;&amp;&gt; Иванова/);
  assert.match(message, /Платформа: ВКонтакте/);
  assert.match(message, /ID клиента: 6 · ВКонтакте ID: 516072459/);
  assert.match(message, /https:\/\/vk.com\/id516072459/);
  assert.match(message, /https:\/\/vk.com\/im\?sel=516072459/);
  assert.match(message, /договор &lt;&amp;&gt;.pdf/);
  assert.match(message, /a=1&amp;b=2/);
  assert.match(message, /&lt;b&gt;Не теги&lt;\/b&gt;/);
  assert.doesNotMatch(message, /null|undefined|@не указан/);
  const missing = formatOrderNotification({
    ...order,
    user: { ...order.user, firstName: null, lastName: null },
  });
  assert.match(missing, /Имя не указано/);
  assert.match(missing, /vk.com\/id516072459/);
});

test("Telegram notification keeps username links and falls back to numeric ID", () => {
  const user = {
    ...order.user,
    identities: [{ provider: "TELEGRAM" as const, externalUserId: "42" }],
    telegramId: "42",
    username: "anna_test",
  };
  const message = formatOrderNotification({ ...order, user });
  assert.match(message, /Платформа: Telegram/);
  assert.match(message, /https:\/\/t.me\/anna_test/);
  assert.doesNotMatch(message, /vk.com/);
  assert.match(
    formatOrderNotification({ ...order, user: { ...user, username: null } }),
    /tg:\/\/user\?id=42/
  );
});

test("notification delivery reports a Telegram API rejection without sending real messages", async (t) => {
  installNotificationEnv(t, { VK_ADMIN_PEER_IDS: "" });
  const send = t.mock.method(axios, "post", async () => ({
    data: { ok: true },
  }));
  assert.equal(
    (await sendOrderNotification(order, "test-admin")).telegram,
    "sent"
  );
  assert.equal(send.mock.callCount(), 1);
  send.mock.mockImplementation(async () => ({ data: { ok: false } }));
  assert.equal(
    (await sendOrderNotification(order, "test-admin")).telegram,
    "failed"
  );
});
