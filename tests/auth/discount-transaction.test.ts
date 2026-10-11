import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { installDatabaseStub } from "./database-stub";
import {
  notificationOrder,
  installNotificationEnv,
} from "./order-notification-fixture";

test("first-order retries discard rolled-back orders and deliver only once after a successful commit", async (t) => {
  installDatabaseStub(t);
  installNotificationEnv(t);
  const { prisma } = await import("@/lib/prisma");
  const { POST } = await import("@/app/api/orders/route");
  const user = { ...notificationOrder.user, role: "USER" };
  const orders: any[] = [];
  t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { user },
  }));
  t.mock.method(prisma.order, "findFirst", async () => orders[0] ?? null);
  const create = t.mock.method(
    prisma.order,
    "create",
    async ({ data }: any) => {
      assert.equal(data.userId, user.id);
      assert.equal(data.isFirstOrder, true);
      assert.equal(data.discountPercent, 15);
      const order = {
        ...notificationOrder,
        ...data,
        user,
        printJobs: notificationOrder.printJobs,
      };
      orders.push(order);
      return order;
    }
  );
  let attempts = 0;
  t.mock.method(
    prisma,
    "$transaction",
    async (operation: any, options: any) => {
      assert.deepEqual(options, { isolationLevel: "Serializable" });
      attempts++;
      const order = await operation(prisma);
      if (attempts < 3) {
        orders.length = 0; // PostgreSQL rolls back all writes on P2034.
        throw { code: "P2034" };
      }
      return order;
    }
  );
  const send = t.mock.method(axios, "post", async (url: string) => {
    assert.equal(attempts, 3);
    assert.equal(orders.length, 1);
    return { data: url.includes("telegram") ? { ok: true } : { response: 1 } };
  });
  const response = await POST(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer vk_${"a".repeat(43)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urgency: "ASAP",
        printJobs: notificationOrder.printJobs,
      }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).discountPercent, 15);
  assert.equal(create.mock.callCount(), 3);
  assert.equal(orders.length, 1);
  assert.equal(send.mock.callCount(), 3); // One Telegram + two VK staff destinations.
});

test("completion retry re-reads the successful-order count and sends only the final persisted discount", async (t) => {
  installDatabaseStub(t);
  installNotificationEnv(t);
  const { prisma } = await import("@/lib/prisma");
  const { PATCH } = await import("@/app/api/orders/details/route");
  let count = 2;
  let order = {
    ...notificationOrder,
    userId: 6,
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
    identity: { user: { ...notificationOrder.user, role: "ADMIN" } },
  }));
  t.mock.method(prisma.order, "findUnique", async () => snapshot());
  const read = t.mock.method(prisma.user, "findUniqueOrThrow", async () => ({
    completedOrdersCount: count,
  }));
  const update = t.mock.method(
    prisma.order,
    "update",
    async ({ data }: any) => {
      order = { ...order, ...data };
      return snapshot();
    }
  );
  t.mock.method(prisma.user, "update", async () => ({
    completedOrdersCount: ++count,
  }));
  let attempts = 0;
  t.mock.method(
    prisma,
    "$transaction",
    async (operation: any, options: any) => {
      assert.deepEqual(options, { isolationLevel: "Serializable" });
      const previousOrder = { ...order };
      attempts++;
      const result = await operation(prisma);
      if (attempts === 1) {
        assert.equal(result.order.discountPercent, 5);
        order = previousOrder;
        count = 3; // The conflicting transaction completed another order.
        throw { code: "P2034" };
      }
      return result;
    }
  );
  const messages: string[] = [];
  const send = t.mock.method(
    axios,
    "post",
    async (url: string, parameters: unknown) => {
      assert.equal(attempts, 2);
      if (url.endsWith("messages.isMessagesFromGroupAllowed"))
        return { data: { response: { is_allowed: 1 } } };
      assert.ok(url.endsWith("messages.send"));
      messages.push((parameters as URLSearchParams).get("message")!);
      return { data: { response: 1 } };
    }
  );
  const response = await PATCH(
    new NextRequest("http://localhost/api/orders/details?id=62", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer vk_${"a".repeat(43)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "COMPLETED" }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).discountPercent, 0);
  assert.equal(count, 4);
  assert.equal(read.mock.callCount(), 2);
  assert.deepEqual(
    update.mock.calls.map(
      ({ arguments: args }) => args[0].data.discountPercent
    ),
    [5, 0]
  );
  assert.equal(send.mock.callCount(), 2);
  assert.equal(messages.length, 1);
  assert.doesNotMatch(messages[0], /будет применена скидка/);
});

test("discount transactions have bounded conflict retries and do not retry unrelated errors", async (t) => {
  installDatabaseStub(t);
  const { prisma } = await import("@/lib/prisma");
  const { orderDiscounts } = await import("@/lib/order-discounts.server");
  let error: unknown = { code: "P2034" };
  const transaction = t.mock.method(prisma, "$transaction", async () => {
    throw error;
  });
  await assert.rejects(
    orderDiscounts.createOrder(6, {}),
    (actual) => actual === error
  );
  assert.equal(transaction.mock.callCount(), 3);
  error = { code: "P2025" };
  await assert.rejects(
    orderDiscounts.createOrder(6, {}),
    (actual) => actual === error
  );
  assert.equal(transaction.mock.callCount(), 4);
});
