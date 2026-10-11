import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import axios from "axios";
import { NextRequest } from "next/server";
import { ThemeProvider } from "@/app/theme-provider";
import { LoyaltyProgress } from "@/components/loyalty-progress";
import { OrderDetails } from "@/components/order-details";
import { statusOptions } from "@/components/order-list/config";
import {
  getCompletionDiscount,
  getLoyaltyProgress,
} from "@/lib/order-discounts";
import { formatCustomerStatusMessage } from "@/lib/notifications";
import { formatOrderNotification } from "@/lib/order-notifications";
import { LOYALTY_DISCOUNT_PERCENT } from "@/config/loyalty";
import { installDatabaseStub } from "./database-stub";
import {
  notificationOrder,
  installNotificationEnv,
} from "./order-notification-fixture";

test("loyalty progress counts successful completions and does not combine first-order and loyalty discounts", () => {
  for (let count = 0; count < 9; count++) {
    assert.deepEqual(getLoyaltyProgress(count), {
      filled: count % 3,
      remaining: 3 - (count % 3),
    });
    assert.equal(
      getCompletionDiscount(count, 0),
      (count + 1) % 3 === 0 ? LOYALTY_DISCOUNT_PERCENT : 0
    );
    assert.equal(getCompletionDiscount(count, 15), 15);
  }
  assert.ok(!statusOptions.some(({ value }) => String(value) === "PROCESSING"));
});

test("loyalty completes once, serializes competing orders, preserves progress on deletion and rolls back failed completion", async (t) => {
  installDatabaseStub(t);
  installNotificationEnv(t);
  const { prisma } = await import("@/lib/prisma");
  const { PATCH, DELETE, GET } = await import("@/app/api/orders/details/route");
  t.mock.method(console, "error", () => {});
  const counts = new Map([
    [6, 0],
    [7, 2],
  ]);
  const orders = new Map<number, any>();
  for (let id = 10; id <= 19; id++)
    orders.set(id, {
      ...notificationOrder,
      id,
      userId: 6,
      status: "PRINTING",
      discountPercent: id === 11 ? 15 : 0,
      isFirstOrder: id === 11,
      updatedAt: new Date("2026-10-11T10:00:00Z"),
    });
  orders.set(20, { ...orders.get(10), id: 20, userId: 7 });
  const snapshot = (order: any) => ({
    ...order,
    user: {
      ...notificationOrder.user,
      id: order.userId,
      completedOrdersCount: counts.get(order.userId),
      identities: [
        { provider: "VK", externalUserId: "42", vkMessagesEnabled: true },
      ],
    },
  });
  t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { user: { ...notificationOrder.user, id: 99, role: "ADMIN" } },
  }));
  t.mock.method(prisma.order, "findUnique", async ({ where }: any) =>
    orders.has(where.id) ? snapshot(orders.get(where.id)) : null
  );
  t.mock.method(prisma.order, "findFirst", async ({ where }: any) =>
    orders.has(where.id) ? snapshot(orders.get(where.id)) : null
  );
  let tail = Promise.resolve();
  let transactionActive = false;
  t.mock.method(prisma, "$transaction", (callback: any, options: any) => {
    assert.deepEqual(options, { isolationLevel: "Serializable" });
    const pending = tail.then(async () => {
      transactionActive = true;
      const previousOrders = new Map(
        [...orders].map(([id, order]) => [id, { ...order }])
      );
      const previousCounts = new Map(counts);
      try {
        return await callback(prisma);
      } catch (error) {
        orders.clear();
        previousOrders.forEach((order, id) => orders.set(id, order));
        counts.clear();
        previousCounts.forEach((count, id) => counts.set(id, count));
        throw error;
      } finally {
        transactionActive = false;
      }
    });
    tail = pending.then(
      () => undefined,
      () => undefined
    );
    return pending;
  });
  t.mock.method(prisma.user, "findUniqueOrThrow", async ({ where }: any) => {
    assert.equal(transactionActive, true);
    assert.ok(counts.has(where.id));
    return { completedOrdersCount: counts.get(where.id) };
  });
  t.mock.method(prisma.order, "update", async ({ where, data }: any) => {
    const order = orders.get(where.id);
    assert.equal(transactionActive, true);
    if (
      (where.status !== undefined && where.status !== order.status) ||
      (where.updatedAt !== undefined &&
        where.updatedAt.getTime() !== order.updatedAt.getTime())
    )
      throw { code: "P2025" };
    Object.assign(order, data, {
      updatedAt: new Date(order.updatedAt.getTime() + 1),
    });
    return snapshot(order);
  });
  let failCounterUpdate = false;
  t.mock.method(prisma.user, "update", async ({ where, data }: any) => {
    assert.equal(transactionActive, true);
    assert.deepEqual(data, { completedOrdersCount: { increment: 1 } });
    if (failCounterUpdate) throw new Error("Synthetic storage failure");
    counts.set(where.id, counts.get(where.id)! + 1);
    return { completedOrdersCount: counts.get(where.id) };
  });
  t.mock.method(prisma.order, "delete", async ({ where }: any) => {
    orders.delete(where.id);
  });
  const send = t.mock.method(axios, "post", async (url: string) => ({
    data: url.includes("telegram")
      ? { ok: true }
      : {
          response: url.endsWith("messages.isMessagesFromGroupAllowed")
            ? { is_allowed: 1 }
            : 1,
        },
  }));
  const request = (
    id: number,
    status?: string,
    body?: unknown,
    authenticated = true
  ) =>
    new NextRequest(`http://localhost/api/orders/details?id=${id}`, {
      method: status || body ? "PATCH" : "GET",
      headers: {
        ...(authenticated && { Authorization: `Bearer vk_${"a".repeat(43)}` }),
        "Content-Type": "application/json",
      },
      ...(status || body
        ? {
            body: JSON.stringify(
              body ?? {
                status,
                ...(status === "CANCELLED" && {
                  cancellationReason: "Тестовая причина отмены",
                }),
              }
            ),
          }
        : {}),
    });
  assert.equal(
    (await PATCH(request(10, "COMPLETED", undefined, false))).status,
    401
  );
  assert.equal((await PATCH(request(10, "PROCESSING"))).status, 400);
  assert.equal(
    (
      await PATCH(
        request(10, undefined, { status: "COMPLETED", discountPercent: 99 })
      )
    ).status,
    400
  );
  assert.equal((await PATCH(request(10, "CANCELLED"))).status, 200);
  assert.equal(counts.get(6), 0);
  const complete = async (id: number) => {
    const response = await PATCH(request(id, "COMPLETED"));
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.equal((await complete(11)).discountPercent, 15);
  assert.equal((await complete(12)).discountPercent, 0);
  const concurrent = await Promise.all([complete(13), complete(14)]);
  assert.deepEqual(
    concurrent.map((order) => order.discountPercent),
    [5, 0]
  );
  assert.equal(counts.get(6), 4);
  assert.equal((await complete(15)).discountPercent, 0);
  assert.equal((await complete(16)).discountPercent, 5);
  assert.equal(counts.get(6), 6);
  const before = send.mock.callCount();
  assert.equal((await complete(13)).discountPercent, 5);
  assert.equal(counts.get(6), 6);
  assert.equal(send.mock.callCount(), before);
  for (const status of ["PRINTING", "PENDING", "CANCELLED"])
    assert.equal((await PATCH(request(13, status))).status, 409);
  assert.equal(
    (await PATCH(request(13, undefined, { comment: "Уточнение" }))).status,
    200
  );
  assert.equal(counts.get(6), 6);
  assert.equal((await (await GET(request(13))).json()).discountPercent, 5);
  assert.equal((await complete(20)).discountPercent, 5);
  assert.equal(counts.get(6), 6);
  assert.equal(counts.get(7), 3);
  const deletion = new NextRequest(
    "http://localhost/api/orders/details?id=13",
    {
      method: "DELETE",
      headers: { Authorization: `Bearer vk_${"a".repeat(43)}` },
    }
  );
  assert.equal((await DELETE(deletion)).status, 200);
  assert.equal(counts.get(6), 6);
  send.mock.mockImplementation(async () => {
    throw new Error("Synthetic delivery failure");
  });
  await complete(17);
  assert.equal(counts.get(6), 7);
  failCounterUpdate = true;
  const sentBeforeFailure = send.mock.callCount();
  assert.equal((await PATCH(request(18, "COMPLETED"))).status, 500);
  assert.equal(orders.get(18).status, "PRINTING");
  assert.equal(counts.get(6), 7);
  assert.equal(send.mock.callCount(), sentBeforeFailure);
  failCounterUpdate = false;
  const sameOrder = await Promise.all([
    PATCH(request(18, "COMPLETED")),
    PATCH(request(18, "COMPLETED")),
  ]);
  assert.deepEqual(
    sameOrder.map((response) => response.status).sort(),
    [200, 409]
  );
  assert.equal(counts.get(6), 8);
  assert.equal((await complete(19)).discountPercent, 5);
});

test("customer messages show final discounts and staff new-order messages retain bonus progress", () => {
  for (const platform of ["telegram", "vk"] as const) {
    const message = formatCustomerStatusMessage(
      62,
      "COMPLETED",
      platform,
      5,
      3
    )!;
    assert.match(message, /будет применена скидка 5%/);
    assert.match(message, /Ещё 3 выполненных заказа/);
    assert.doesNotMatch(
      formatCustomerStatusMessage(62, "CANCELLED", platform, 5, 3)!,
      /скидка/
    );
    const order = {
      ...notificationOrder,
      status: "COMPLETED" as const,
      discountPercent: 5,
      user: { ...notificationOrder.user, completedOrdersCount: 3 },
    };
    const staff = formatOrderNotification(order, platform);
    assert.match(staff, /Новый заказ #62/);
    assert.match(staff, /Обязательно примените скидку 5%/);
    assert.doesNotMatch(staff, /Заказ #62 выполнен/);
    assert.match(
      formatOrderNotification(
        {
          ...order,
          discountPercent: 0,
          user: { ...order.user, completedOrdersCount: 2 },
        },
        platform
      ),
      /Следующий выполненный заказ получит скидку 5%/
    );
  }
});

test("progress plaques expose accessible values and order details show the persisted loyalty discount", () => {
  for (const completedOrdersCount of [0, 1, 2, 3]) {
    const html = renderToStaticMarkup(
      createElement(
        ThemeProvider,
        null,
        createElement(LoyaltyProgress, { completedOrdersCount })
      )
    );
    assert.ok(html.includes(`aria-valuenow="${completedOrdersCount % 3}"`));
    assert.ok(html.includes("5%"));
  }
  for (const isAdmin of [false, true]) {
    const html = renderToStaticMarkup(
      createElement(
        ThemeProvider,
        null,
        createElement(OrderDetails, {
          data: { ...notificationOrder, discountPercent: 5 },
          isAdmin,
        })
      )
    );
    assert.ok(html.includes("5%"));
    assert.equal(html.includes("Обязательно"), isAdmin);
  }
});
