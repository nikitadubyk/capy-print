import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { installDatabaseStub } from "./database-stub";
import { clearClientSession, establishSession } from "@/store/api/session";
import { apiInstance } from "@/store/api/instance";
import {
  createOrderOptions,
  orderListOptions,
} from "@/store/api/orders/queries";
import { Urgency } from "@/types";

test("VK creation refreshes the cached My orders list using the same Bearer owner", async (t) => {
  installDatabaseStub(t);
  clearClientSession();
  t.after(clearClientSession);
  const { prisma } = await import("@/lib/prisma");
  const { GET, POST } = await import("@/app/api/orders/route");
  const user = {
    id: 6,
    role: "USER" as const,
    telegramId: null,
    firstName: "Анна",
    lastName: "Иванова",
    username: null,
  };
  const identity = { provider: "VK", externalUserId: "516072459", user };
  const token = "vk_" + "a".repeat(43);
  const login = t.mock.method(axios.Axios.prototype, "request", async () => ({
    data: { token, platform: "vk", user },
  }));
  await establishSession("vk", "test-launch-data");
  login.mock.restore();
  const orders: any[] = [];
  t.mock.method(prisma.session, "findFirst", async () => ({ identity }));
  t.mock.method(prisma.order, "count", async ({ where }: any) => {
    assert.equal(where.userId, 6);
    return orders.length;
  });
  t.mock.method(prisma.order, "findMany", async ({ where }: any) => {
    assert.equal(where.userId, 6);
    return [...orders];
  });
  t.mock.method(prisma.order, "create", async ({ data }: any) => {
    assert.equal(data.userId, 6);
    const order = {
      id: 62,
      ...data,
      createdAt: new Date(),
      user: { ...user, identities: [identity] },
      printJobs: [],
    };
    orders.push(order);
    return order;
  });
  t.mock.method(axios, "post", async () => ({ data: { ok: true } }));
  const previousAdapter = apiInstance.defaults.adapter;
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
  });
  let listRequests = 0;
  apiInstance.defaults.adapter = async (config) => {
    // Exercise the real Axios interceptor, URL builder and HTTP routes.
    assert.equal(config.headers.get("Authorization"), `Bearer ${token}`);
    const isPost = config.method === "post";
    if (!isPost) listRequests++;
    const request = new NextRequest(`http://localhost/api/${config.url}`, {
      method: isPost ? "POST" : "GET",
      headers: { Authorization: String(config.headers.get("Authorization")) },
      ...(isPost && { body: config.data }),
    });
    const response = await (isPost ? POST(request) : GET(request));
    assert.ok(response.status < 400);
    return {
      data: await response.json(),
      status: response.status,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  t.after(() => client.clear());
  const observer = new QueryObserver(
    client,
    orderListOptions({ page: 1, scope: "mine" }, user, false)
  );
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  assert.equal(listRequests, 0); // No API call until initialization/profile sync completes.
  observer.setOptions(orderListOptions({ page: 1, scope: "mine" }, user, true));
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.total, 0);
  const before = listRequests;
  const mutation = client
    .getMutationCache()
    .build(client, createOrderOptions(client));
  await mutation.execute({
    urgency: Urgency.ASAP,
    printJobs: [
      {
        files: [
          {
            fileUrl: "https://example.test/document.pdf",
            fileName: "document.pdf",
            fileSize: 42,
          },
        ],
      },
    ],
  });
  assert.ok(listRequests > before);
  const result = observer.getCurrentResult().data!;
  assert.equal(result.total, 1);
  assert.equal(result.orders[0].id, 62);
  assert.equal(result.orders[0].user.id, 6);
  // Personal list cache cannot be reused by another user or the administrative list.
  assert.equal(
    client.getQueryData(
      orderListOptions({ page: 1, scope: "mine" }, { ...user, id: 7 }, true)
        .queryKey
    ),
    undefined
  );
  assert.equal(
    client.getQueryData(
      orderListOptions({ page: 1, scope: "all" }, user, true).queryKey
    ),
    undefined
  );
});
