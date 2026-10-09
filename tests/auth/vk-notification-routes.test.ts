import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { installDatabaseStub } from "./database-stub";

test("VK permission and status routes use verified identity, preserve status on delivery failure and avoid duplicates", async (t) => {
  installDatabaseStub(t);
  const previous = {
    id: process.env.VK_GROUP_ID,
    token: process.env.VK_GROUP_TOKEN,
  };
  t.after(() => {
    if (previous.id === undefined) delete process.env.VK_GROUP_ID;
    else process.env.VK_GROUP_ID = previous.id;
    if (previous.token === undefined) delete process.env.VK_GROUP_TOKEN;
    else process.env.VK_GROUP_TOKEN = previous.token;
  });
  process.env.VK_GROUP_ID = "123";
  process.env.VK_GROUP_TOKEN = "test-community-token";
  const { prisma } = await import("@/lib/prisma");
  const { GET, POST } = await import("@/app/api/vk/messages/permission/route");
  const { PATCH } = await import("@/app/api/orders/details/route");
  const user = {
    id: 7,
    role: "ADMIN",
    telegramId: null,
    firstName: null,
    lastName: null,
    username: null,
  };
  const identity = {
    id: 17,
    provider: "VK",
    externalUserId: "42",
    vkMessagesEnabled: null as boolean | null,
    user,
  };
  const session = t.mock.method(prisma.session, "findFirst", async () => ({
    identity,
  }));
  const send = t.mock.method(
    axios,
    "post",
    async (...args: unknown[]): Promise<{ data: unknown }> => ({
      data: {
        response: String(args[0]).endsWith("messages.send")
          ? 9001
          : { is_allowed: 1 },
      },
    })
  );
  t.mock.method(console, "error", () => {});
  const request = (path: string, status?: string, authorized = true) =>
    new NextRequest(`http://localhost/api/${path}`, {
      method: status ? "PATCH" : "GET",
      headers: {
        ...(authorized && { Authorization: `Bearer vk_${"a".repeat(43)}` }),
        "Content-Type": "application/json",
      },
      ...(status && { body: JSON.stringify({ status }) }),
    });
  assert.equal(
    (await GET(request("vk/messages/permission?user_id=999", undefined, false)))
      .status,
    401
  );
  assert.equal(session.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
  identity.provider = "TELEGRAM";
  assert.equal((await GET(request("vk/messages/permission"))).status, 403);
  assert.equal(send.mock.callCount(), 0);
  identity.provider = "VK";
  const permission = await GET(
    request("vk/messages/permission?user_id=999&group_id=999&allowed=true")
  );
  assert.equal(permission.status, 200);
  assert.equal(permission.headers.get("cache-control"), "no-store");
  assert.deepEqual(await permission.json(), {
    configured: true,
    groupId: 123,
    allowed: true,
    enabled: null,
  });
  const params = send.mock.calls[0].arguments[1] as unknown as URLSearchParams;
  assert.equal(params.get("user_id"), "42");
  assert.equal(params.get("group_id"), "123");
  send.mock.mockImplementation(async () => ({
    data: { error: { error_code: 5 } },
  }));
  assert.equal((await GET(request("vk/messages/permission"))).status, 502);
  delete process.env.VK_GROUP_TOKEN;
  assert.deepEqual(
    await (await GET(request("vk/messages/permission"))).json(),
    { configured: false, groupId: null, allowed: null, enabled: null }
  );
  process.env.VK_GROUP_TOKEN = "test-community-token";

  let order = {
    id: 11,
    status: "PENDING",
    updatedAt: new Date("2026-10-09T10:00:00Z"),
    user: {
      ...user,
      identities: [
        { provider: "VK", externalUserId: "42", vkMessagesEnabled: true },
      ],
    },
    printJobs: [],
  };
  t.mock.method(prisma.order, "findUnique", async () => ({ ...order }));
  const update = t.mock.method(
    prisma.order,
    "update",
    async ({ data, where }: any) => {
      if (where.status !== order.status) throw { code: "P2025" };
      order = {
        ...order,
        ...data,
        updatedAt: new Date(order.updatedAt.getTime() + 1),
      };
      return order;
    }
  );
  send.mock.mockImplementation(async (...args: unknown[]) => ({
    data: {
      response: String(args[0]).endsWith("messages.send")
        ? 9001
        : { is_allowed: 1 },
    },
  }));
  let calls = send.mock.callCount();
  const transitions = await Promise.all([
    PATCH(request("orders/details?id=11", "PRINTING")),
    PATCH(request("orders/details?id=11", "PRINTING")),
  ]);
  assert.deepEqual(
    transitions.map((response) => response.status).sort(),
    [200, 409]
  );
  assert.equal(send.mock.callCount(), calls + 2); // One permission check, one delivery.
  assert.equal(update.mock.calls[0].arguments[0].where.status, "PENDING");
  calls = send.mock.callCount();
  assert.equal(
    (await PATCH(request("orders/details?id=11", "PRINTING"))).status,
    200
  );
  assert.equal(send.mock.callCount(), calls);

  send.mock.mockImplementation(async () => ({
    data: { error: { error_code: 901 } },
  }));
  const completed = await PATCH(request("orders/details?id=11", "COMPLETED"));
  assert.equal(completed.status, 200);
  assert.equal((await completed.json()).status, "COMPLETED");
  calls = send.mock.callCount();
  assert.equal(
    (await PATCH(request("orders/details?id=11", "COMPLETED"))).status,
    200
  );
  assert.equal(send.mock.callCount(), calls);

  send.mock.mockImplementation(async (...args: unknown[]) => ({
    data: String(args[0]).endsWith("messages.send")
      ? { error: { error_code: 901 } }
      : { response: { is_allowed: 1 } },
  }));
  calls = send.mock.callCount();
  const cancelled = await PATCH(request("orders/details?id=11", "CANCELLED"));
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).status, "CANCELLED");
  assert.equal(send.mock.callCount(), calls + 2);

  const saveRequest = (body: unknown, authorized = true) =>
    new NextRequest("http://localhost/api/vk/messages/permission?user_id=999", {
      method: "POST",
      headers: {
        ...(authorized && { Authorization: `Bearer vk_${"a".repeat(43)}` }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const save = t.mock.method(
    prisma.userIdentity,
    "update",
    async ({ where, data }: any) => {
      assert.equal(where.id, 17);
      identity.vkMessagesEnabled = data.vkMessagesEnabled;
      return { ...identity };
    }
  );
  assert.equal(
    (await POST(saveRequest({ enabled: false }, false))).status,
    401
  );
  identity.provider = "TELEGRAM";
  assert.equal((await POST(saveRequest({ enabled: false }))).status, 403);
  identity.provider = "VK";
  for (const body of [
    { enabled: "true" },
    { enabled: true, userId: 999 },
    {},
    null,
  ])
    assert.equal((await POST(saveRequest(body))).status, 400);
  assert.equal(save.mock.callCount(), 0);

  send.mock.mockImplementation(async () => ({
    data: { response: { is_allowed: 0 } },
  }));
  assert.equal((await POST(saveRequest({ enabled: true }))).status, 403);
  assert.equal(save.mock.callCount(), 0);
  send.mock.mockImplementation(async () => ({
    data: { error: { error_code: 5 } },
  }));
  assert.equal((await POST(saveRequest({ enabled: true }))).status, 502);
  assert.equal(save.mock.callCount(), 0);
  delete process.env.VK_GROUP_TOKEN;
  assert.equal((await POST(saveRequest({ enabled: true }))).status, 503);
  calls = send.mock.callCount();
  assert.equal((await POST(saveRequest({ enabled: false }))).status, 200);
  assert.equal(identity.vkMessagesEnabled, false);
  const declined = await (await GET(request("vk/messages/permission"))).json();
  assert.equal(declined.enabled, false);
  assert.equal(send.mock.callCount(), calls); // Refusal needs no VK request, even after a new session.

  process.env.VK_GROUP_TOKEN = "test-community-token";
  send.mock.mockImplementation(async () => ({
    data: { response: { is_allowed: 1 } },
  }));
  assert.equal((await POST(saveRequest({ enabled: true }))).status, 200);
  assert.equal(identity.vkMessagesEnabled, true);
  calls = send.mock.callCount();
  assert.equal(
    (await (await GET(request("vk/messages/permission"))).json()).enabled,
    true
  );
  assert.equal(send.mock.callCount(), calls);
  save.mock.mockImplementation(async () => {
    throw new Error("storage unavailable");
  });
  assert.equal((await POST(saveRequest({ enabled: false }))).status, 502);
  assert.equal(identity.vkMessagesEnabled, true);
});
