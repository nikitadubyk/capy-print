import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { QueryClient } from "@tanstack/react-query";
import { createOrderOptions } from "@/store/api/orders/queries";
import { formatOrderNotification } from "@/lib/order-notifications";
import { FIRST_ORDER_STAFF_REMINDER } from "@/config/first-order";
import { installDatabaseStub } from "./database-stub";
import {
  installNotificationEnv,
  notificationOrder,
} from "./order-notification-fixture";

test("first-order eligibility is server-owned, includes cancelled orders and survives subsequent orders", async (t) => {
  installDatabaseStub(t);
  installNotificationEnv(t);
  const { prisma } = await import("@/lib/prisma");
  const { POST } = await import("@/app/api/orders/route");
  const { GET: me } = await import("@/app/api/user/route");
  const { GET: details } = await import("@/app/api/orders/details/route");
  const user = { ...notificationOrder.user, telegramId: null, role: "USER" };
  t.mock.method(prisma.user, "findUniqueOrThrow", async () => ({
    completedOrdersCount: 0,
  }));
  const orders: any[] = [];
  t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { user },
  }));
  t.mock.method(axios, "post", async (url: string) => ({
    data: url.includes("telegram") ? { ok: true } : { response: 1 },
  }));
  t.mock.method(
    prisma.order,
    "findFirst",
    async ({ where }: any) =>
      orders.find(
        (order) =>
          order.userId === where.userId && (!where.id || order.id === where.id)
      ) ?? null
  );
  let transactionActive = false;
  const events: string[] = [];
  // Model successful serializable transactions and their commit boundary.
  let tail = Promise.resolve();
  t.mock.method(prisma, "$transaction", (callback: any, options: any) => {
    assert.deepEqual(options, { isolationLevel: "Serializable" });
    const pending = tail.then(async () => {
      transactionActive = true;
      events.push("transaction");
      try {
        return await callback(prisma);
      } finally {
        transactionActive = false;
        events.push("commit");
      }
    });
    tail = pending.then(
      () => undefined,
      () => undefined
    );
    return pending;
  });
  t.mock.method(prisma.order, "create", async ({ data }: any) => {
    assert.equal(transactionActive, true);
    const order = {
      ...notificationOrder,
      id: orders.length + 1,
      userId: data.userId,
      isFirstOrder: data.isFirstOrder,
      discountPercent: data.discountPercent,
    };
    orders.push(order);
    events.push("create");
    return order;
  });
  const request = (path: string, body?: unknown) =>
    new NextRequest(`http://localhost/api/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer vk_${"a".repeat(43)}`,
        "Content-Type": "application/json",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  const payload = {
    urgency: "ASAP",
    printJobs: notificationOrder.printJobs,
    userId: 999,
    isFirstOrder: false,
  };
  const eligibility = async () =>
    (await (await me(request("user?userId=999"))).json()).user.isFirstOrder;
  assert.equal(await eligibility(), true);
  const [first, second] = await Promise.all([
    POST(request("orders", payload)),
    POST(request("orders", { ...payload, isFirstOrder: true })),
  ]);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((await first.json()).isFirstOrder, true);
  assert.equal((await second.json()).isFirstOrder, false);
  assert.deepEqual(events, [
    "transaction",
    "create",
    "commit",
    "transaction",
    "create",
    "commit",
  ]);
  assert.equal(orders.filter((order) => order.isFirstOrder).length, 1);
  assert.equal(await eligibility(), false);
  assert.equal(
    (await (await details(request("orders/details?id=1"))).json()).isFirstOrder,
    true
  );
  orders.splice(1);
  orders[0].status = "CANCELLED";
  assert.equal(await eligibility(), false);
  orders.length = 0;
  orders.push({ id: 900, userId: 999 });
  assert.equal(await eligibility(), true); // Another user's order does not affect this user.
  t.mock.method(prisma.order, "findFirst", async () => {
    throw new Error("storage failure");
  });
  assert.equal((await me(request("user"))).status, 500);
});

test("Telegram and VK staff messages require 15% only for the saved first order", () => {
  for (const platform of ["telegram", "vk"] as const) {
    assert.ok(
      formatOrderNotification(
        { ...notificationOrder, isFirstOrder: true, discountPercent: 15 },
        platform
      ).includes(FIRST_ORDER_STAFF_REMINDER)
    );
    assert.ok(
      !formatOrderNotification(notificationOrder, platform).includes(
        FIRST_ORDER_STAFF_REMINDER
      )
    );
  }
});

test("successful creation removes the offer from only the current user's cache", async () => {
  const client = new QueryClient();
  try {
    client.setQueryData(["users", 6], { id: 6, isFirstOrder: true });
    client.setQueryData(["users", 7], { id: 7, isFirstOrder: true });
    await createOrderOptions(client).onSuccess({
      id: 62,
      userId: 6,
      isFirstOrder: true,
      discountPercent: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      comment: null,
      cancellationReason: null,
      deadlineAt: null,
      status: "PENDING",
      urgency: "ASAP",
    });
    assert.equal(client.getQueryData<any>(["users", 6]).isFirstOrder, false);
    assert.equal(client.getQueryData<any>(["users", 7]).isFirstOrder, true);
  } finally {
    client.clear();
  }
});
