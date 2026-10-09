import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { installDatabaseStub } from "./database-stub";
import {
  installNotificationEnv,
  notificationOrder,
} from "./order-notification-fixture";

test("order creation persists before delivery and remains successful when any/all notification channels fail", async (t) => {
  installNotificationEnv(t);
  installDatabaseStub(t);
  const { prisma } = await import("@/lib/prisma");
  const { POST } = await import("@/app/api/orders/route");
  t.mock.method(console, "error", () => {});
  const user = { ...notificationOrder.user, role: "USER" as const };
  t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { provider: "VK", externalUserId: "516072459", user },
  }));
  let saved = 0;
  t.mock.method(prisma.order, "create", async ({ data }: any) => {
    assert.equal(data.userId, 6);
    saved++;
    return { ...notificationOrder, user };
  });
  const peers: string[] = [];
  let failVk = false;
  t.mock.method(axios, "post", async (url: string, params: unknown) => {
    assert.ok(saved > 0);
    if (url.includes("api.telegram.org"))
      throw new axios.AxiosError("mock network failure", "ECONNRESET");
    peers.push((params as URLSearchParams).get("peer_id")!);
    return {
      data: failVk ? { error: { error_code: 901 } } : { response: 901 },
    };
  });
  const request = () =>
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer vk_${"a".repeat(43)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urgency: "ASAP",
        printJobs: notificationOrder.printJobs,
        vkAdminPeerIds: [999],
      }),
    });
  for (const failure of [false, true]) {
    failVk = failure;
    const response = await POST(request());
    assert.equal(response.status, 201);
    assert.equal((await response.json()).id, 62);
  }
  assert.equal(saved, 2);
  assert.deepEqual(peers, ["42", "43", "42", "43"]); // Client input cannot choose staff recipients.
});
