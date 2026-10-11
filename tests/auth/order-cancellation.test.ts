import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemeProvider } from "@/app/theme-provider";
import { OrderDetails } from "@/components/order-details";
import { cancelOrderDialogSchema } from "@/components/order-list/cancel-order-dialog-schema";
import { updateOrderSchema } from "@/lib/order-validation";
import {
  formatCustomerStatusMessage,
  sendCustomerStatusNotification,
} from "@/lib/notifications";
import { CANCELLATION_REASON_MAX_LENGTH } from "@/config/order-cancellation";
import { installDatabaseStub } from "./database-stub";
import {
  notificationOrder,
  installNotificationEnv,
} from "./order-notification-fixture";

test("cancellation form resolver rejects empty/whitespace/oversized reasons and returns a trimmed reason", async () => {
  const resolve = zodResolver(cancelOrderDialogSchema);
  const options = { fields: {}, shouldUseNativeValidation: false };
  for (const cancellationReason of [
    "",
    " \n\t ",
    "a".repeat(CANCELLATION_REASON_MAX_LENGTH + 1),
  ]) {
    const result = await resolve({ cancellationReason }, undefined, options);
    assert.deepEqual(result.values, {});
    assert.ok(result.errors.cancellationReason?.message);
    assert.equal(
      updateOrderSchema.safeParse({ status: "CANCELLED", cancellationReason })
        .success,
      false
    );
  }
  for (const cancellationReason of [
    "  Не открывается файл\nПопробуйте PDF  ",
    "a".repeat(CANCELLATION_REASON_MAX_LENGTH),
  ]) {
    const result = await resolve({ cancellationReason }, undefined, options);
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.values, {
      cancellationReason: cancellationReason.trim(),
    });
    assert.equal(
      updateOrderSchema.safeParse({ status: "CANCELLED", ...result.values })
        .success,
      true
    );
  }
  assert.equal(
    (await resolve({ cancellationReason: "" }, undefined, options)).errors
      .cancellationReason?.message,
    "Укажите причину отмены"
  );
});

test("cancellation requires a trimmed reason and cannot change it independently of cancellation", () => {
  for (const body of [
    { status: "CANCELLED" },
    { status: "CANCELLED", cancellationReason: "" },
    { status: "CANCELLED", cancellationReason: " \n\t " },
    {
      status: "CANCELLED",
      cancellationReason: "a".repeat(CANCELLATION_REASON_MAX_LENGTH + 1),
    },
    { status: "CANCELLED", cancellationReason: null },
    { status: "PRINTING", cancellationReason: "Причина" },
    { cancellationReason: "Причина" },
  ])
    assert.equal(updateOrderSchema.safeParse(body).success, false);
  assert.equal(
    updateOrderSchema.parse({
      status: "CANCELLED",
      cancellationReason: "  Не открывается файл\nПопробуйте PDF  ",
    }).cancellationReason,
    "Не открывается файл\nПопробуйте PDF"
  );
});

test("only admins can cancel with a reason; cancellation is saved before delivery and repeated/concurrent updates send once", async (t) => {
  installDatabaseStub(t);
  installNotificationEnv(t);
  const { prisma } = await import("@/lib/prisma");
  const { PATCH, GET } = await import("@/app/api/orders/details/route");
  t.mock.method(console, "error", () => {});
  let role = "USER";
  let count = 2;
  let order = {
    ...notificationOrder,
    userId: 6,
    cancellationReason: null as string | null,
    status: "PRINTING",
    updatedAt: new Date("2026-10-11T10:00:00Z"),
  };
  const snapshot = () => ({
    ...order,
    user: {
      ...notificationOrder.user,
      completedOrdersCount: count,
      identities: [
        { provider: "VK", externalUserId: "42", vkMessagesEnabled: true },
      ],
    },
  });
  t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { user: { ...notificationOrder.user, role } },
  }));
  t.mock.method(prisma.order, "findUnique", async () => snapshot());
  t.mock.method(prisma.order, "findFirst", async () => snapshot());
  t.mock.method(
    prisma,
    "$transaction",
    async (operation: any, options: any) => {
      assert.equal(options.isolationLevel, "Serializable");
      return operation(prisma);
    }
  );
  const update = t.mock.method(
    prisma.order,
    "update",
    async ({ data, where }: any) => {
      if (
        where.status !== order.status ||
        where.updatedAt.getTime() !== order.updatedAt.getTime()
      )
        throw { code: "P2025" };
      order = {
        ...order,
        ...data,
        updatedAt: new Date(order.updatedAt.getTime() + 1),
      };
      return snapshot();
    }
  );
  t.mock.method(prisma.user, "findUniqueOrThrow", async () => ({
    completedOrdersCount: count,
  }));
  t.mock.method(prisma.user, "update", async () => ({
    completedOrdersCount: ++count,
  }));
  const messages: string[] = [];
  let failDelivery = false;
  const send = t.mock.method(
    axios,
    "post",
    async (url: string, parameters: unknown) => {
      assert.ok(url.includes("api.vk.ru")); // No additional staff Telegram message on completion.
      const params = parameters as URLSearchParams;
      assert.equal(params.get("peer_id"), null); // No additional VK staff messages.
      if (url.endsWith("messages.isMessagesFromGroupAllowed"))
        return { data: { response: { is_allowed: 1 } } };
      if (failDelivery) throw new Error("Synthetic delivery failure");
      assert.equal(params.get("user_id"), "42");
      if (order.status === "CANCELLED") assert.ok(order.cancellationReason);
      messages.push(params.get("message")!);
      return { data: { response: 1 } };
    }
  );
  const request = (body: unknown, authenticated = true, id = 62) =>
    new NextRequest(`http://localhost/api/orders/details?id=${id}`, {
      method: "PATCH",
      headers: {
        ...(authenticated && { Authorization: `Bearer vk_${"a".repeat(43)}` }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const reason = "Файл <b>не открывается</b> & повреждён\nПришлите PDF";
  const body = { status: "CANCELLED", cancellationReason: `  ${reason}  ` };
  assert.equal((await PATCH(request(body, false))).status, 401);
  assert.equal((await PATCH(request(body))).status, 403);
  role = "ADMIN";
  for (const cancellationReason of [undefined, "", " \n ", "a".repeat(1001)])
    assert.equal(
      (await PATCH(request({ status: "CANCELLED", cancellationReason })))
        .status,
      400
    );
  assert.equal(update.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
  const responses = await Promise.all([
    PATCH(request(body)),
    PATCH(request(body)),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 409]
  );
  assert.equal(order.status, "CANCELLED");
  assert.equal(order.cancellationReason, reason);
  assert.equal(order.comment, notificationOrder.comment);
  assert.equal(count, 2);
  assert.equal(messages.length, 1);
  assert.ok(messages[0].includes(`Причина отмены:\n${reason}`));
  const calls = send.mock.callCount();
  assert.equal((await PATCH(request(body))).status, 200);
  assert.equal(send.mock.callCount(), calls);
  const details = await GET(
    new NextRequest("http://localhost/api/orders/details?id=62", {
      headers: { Authorization: `Bearer vk_${"a".repeat(43)}` },
    })
  );
  assert.equal((await details.json()).cancellationReason, reason);
  assert.equal((await PATCH(request({ status: "PRINTING" }))).status, 200);
  assert.equal(order.cancellationReason, null);
  const complete = await PATCH(request({ status: "COMPLETED" }));
  assert.equal(complete.status, 200);
  assert.equal((await complete.json()).discountPercent, 5);
  assert.equal(count, 3);
  assert.ok(messages.at(-1)?.includes("будет применена скидка 5%"));
  // A failed cancellation message cannot undo the persisted status/reason or retry the same event.
  order = { ...order, id: 63, status: "PRINTING", discountPercent: 0 };
  failDelivery = true;
  assert.equal((await PATCH(request(body, true, 63))).status, 200);
  assert.equal(order.cancellationReason, reason);
  const failedCalls = send.mock.callCount();
  assert.equal((await PATCH(request(body, true, 63))).status, 200);
  assert.equal(send.mock.callCount(), failedCalls);
});

test("cancellation reasons are escaped for Telegram, stay plain in VK and remain visible in order details", async (t) => {
  installNotificationEnv(t);
  const reason = '<b>Файл</b> & "формат"\nПришлите PDF';
  const vk = formatCustomerStatusMessage(62, "CANCELLED", "vk", 0, 0, reason)!;
  const telegram = formatCustomerStatusMessage(
    62,
    "CANCELLED",
    "telegram",
    0,
    0,
    reason
  )!;
  assert.ok(vk.includes(reason));
  assert.ok(
    telegram.includes(
      "&lt;b&gt;Файл&lt;/b&gt; &amp; &quot;формат&quot;\nПришлите PDF"
    )
  );
  assert.ok(!telegram.includes("<b>Файл</b>"));
  const send = t.mock.method(axios, "post", async () => ({
    data: { ok: true },
  }));
  assert.equal(
    await sendCustomerStatusNotification({
      id: 62,
      status: "CANCELLED",
      updatedAt: new Date(),
      cancellationReason: reason,
      user: { telegramId: "42" },
    }),
    "sent"
  );
  const params = send.mock.calls[0].arguments[1] as unknown as {
    text: string;
    chat_id: string;
  };
  assert.equal(params.text, telegram);
  assert.equal(params.chat_id, "42");
  const html = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      null,
      createElement(OrderDetails, {
        data: {
          ...notificationOrder,
          status: "CANCELLED",
          cancellationReason: reason,
        },
      })
    )
  );
  assert.ok(html.includes("Причина отмены"));
  assert.ok(html.includes("&lt;b&gt;Файл&lt;/b&gt;"));
});
