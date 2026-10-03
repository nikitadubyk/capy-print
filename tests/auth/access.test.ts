import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { NextRequest } from "next/server";
import { installDatabaseStub } from "./database-stub";

test("business API: user and access come exclusively from the server session", async (t) => {
  installDatabaseStub(t);
  const { prisma } = await import("@/lib/prisma");
  const { GET: list, POST: create } = await import("@/app/api/orders/route");
  const {
    GET: details,
    PATCH,
    DELETE,
  } = await import("@/app/api/orders/details/route");
  const { GET: me, POST: oldUpsert } = await import("@/app/api/user/route");
  const { ourFileRouter } = await import("@/app/api/uploadthing/core");
  const user = {
    id: 7,
    role: "USER",
    telegramId: BigInt(42),
    firstName: "Капи",
    lastName: null,
    username: null,
  };
  const token = "telegram_" + "a".repeat(43);
  const order = {
    id: 11,
    userId: 7,
    user,
    printJobs: [],
    status: "PENDING",
    urgency: "ASAP",
  };
  const otherOrder = { ...order, id: 12, userId: 8 };
  const whereMatches = (where: any, candidate: any) =>
    (!where.id || candidate.id === where.id) &&
    (!where.userId || candidate.userId === where.userId);
  const sessionMock = t.mock.method(prisma.session, "findFirst", async () => ({
    identity: { user },
  }));
  t.mock.method(prisma.order, "findMany", async ({ where }: any) =>
    [order, otherOrder].filter((o) => whereMatches(where, o))
  );
  t.mock.method(
    prisma.order,
    "count",
    async ({ where }: any) =>
      [order, otherOrder].filter((o) => whereMatches(where, o)).length
  );
  t.mock.method(
    prisma.order,
    "findFirst",
    async ({ where }: any) =>
      [order, otherOrder].find((o) => whereMatches(where, o)) ?? null
  );
  t.mock.method(
    prisma.order,
    "findUnique",
    async ({ where }: any) =>
      [order, otherOrder].find((o) => o.id === where.id) ?? null
  );
  const createMock = t.mock.method(
    prisma.order,
    "create",
    async ({ data }: any) => ({ ...order, userId: data.userId })
  );
  const updateMock = t.mock.method(
    prisma.order,
    "update",
    async ({ data }: any) => ({ ...order, ...data })
  );
  const deleteMock = t.mock.method(prisma.order, "delete", async () => order);
  // Never deliver real notifications from tests.
  const sendMock = t.mock.method(axios, "post", async () => ({
    data: { ok: true },
  }));
  const req = (
    url: string,
    method = "GET",
    body?: unknown,
    authenticated = true
  ) =>
    new NextRequest(`http://localhost/api/${url}`, {
      method,
      headers: {
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
        "x-telegram-id": "999",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  await t.test(
    "every orders/user route rejects an ID-only request",
    async () => {
      for (const [handler, request] of [
        [list, req("orders?telegramId=999", "GET", undefined, false)],
        [create, req("orders", "POST", { telegramId: 999 }, false)],
        [details, req("orders/details?id=11", "GET", undefined, false)],
        [
          PATCH,
          req("orders/details?id=11", "PATCH", { status: "COMPLETED" }, false),
        ],
        [DELETE, req("orders/details?id=11", "DELETE", undefined, false)],
        [me, req("user?telegramId=999", "GET", undefined, false)],
      ] as const)
        assert.equal((await handler(request)).status, 401);
      assert.equal(sessionMock.mock.callCount(), 0);
      assert.equal(deleteMock.mock.callCount(), 0);
      assert.equal(updateMock.mock.callCount(), 0);
      assert.equal(createMock.mock.callCount(), 0);
      assert.equal(sendMock.mock.callCount(), 0);
      assert.equal((await oldUpsert()).status, 405);
    }
  );
  await t.test(
    "ID in query cannot select another user or expose all orders",
    async () => {
      const response = await list(req("orders?telegramId=999"));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const data = await response.json();
      assert.equal(data.total, 1);
      assert.equal(data.orders[0].userId, 7);
      assert.equal((await list(req("orders?scope=all"))).status, 403);
      assert.equal(
        (await (await me(req("user?telegramId=999"))).json()).user.id,
        7
      );
    }
  );
  await t.test(
    "own details work; another user's details are hidden",
    async () => {
      assert.equal((await details(req("orders/details?id=11"))).status, 200);
      assert.equal(
        (await details(req("orders/details?id=12&telegramId=999"))).status,
        404
      );
      assert.equal(
        (
          await PATCH(
            req("orders/details?id=11", "PATCH", { status: "COMPLETED" })
          )
        ).status,
        403
      );
      assert.equal(
        (await DELETE(req("orders/details?id=11", "DELETE"))).status,
        403
      );
    }
  );
  await t.test(
    "upload middleware requires a session and records internal ownership",
    async () => {
      const middleware = ourFileRouter.fileUploader.middleware;
      const files = [
        {
          name: "test.pdf",
          size: 10,
          type: "application/pdf",
          lastModified: 0,
        },
      ];
      await assert.rejects(
        async () =>
          middleware({
            req: req("uploadthing", "POST", undefined, false),
            files,
            input: undefined,
          }),
        /Сессия недействительна/
      );
      const metadata = await middleware({
        req: req("uploadthing", "POST"),
        files,
        input: undefined,
      });
      assert.equal(metadata.uploadedBy, 7);
      await assert.rejects(
        async () =>
          middleware({
            req: req("uploadthing", "POST"),
            files: [{ ...files[0], type: "application/x-executable" }],
            input: undefined,
          }),
        /Неподдерживаемый тип/
      );
    }
  );
  await t.test(
    "creation ignores spoofed ownership IDs and needs no telegramId",
    async () => {
      const payload = {
        urgency: "ASAP",
        telegramId: 999,
        userId: 999,
        printJobs: [
          {
            files: [
              {
                fileUrl: "https://example.test/file.pdf",
                fileName: "file.pdf",
                fileSize: 10,
              },
            ],
          },
        ],
      };
      const response = await create(req("orders", "POST", payload));
      assert.equal(response.status, 201);
      assert.equal((await response.json()).userId, 7);
      const { telegramId, userId, ...withoutIds } = payload;
      assert.ok(telegramId && userId);
      assert.equal(
        (await create(req("orders", "POST", withoutIds))).status,
        201
      );
      assert.equal(
        (await create(req("orders", "POST", { ...withoutIds, printJobs: [] })))
          .status,
        400
      );
    }
  );
  await t.test(
    "ASAP accepts an empty form deadline; scheduled orders still require a valid date",
    async () => {
      const payload = {
        comment: "",
        deadlineAt: "",
        urgency: "ASAP",
        printJobs: [
          {
            duplex: false,
            isColor: false,
            copies: 1,
            paperSize: "A4Basic",
            files: [
              {
                fileUrl: "https://utfs.io/f/test-document",
                fileName: "document.pdf",
                fileSize: 3291,
                mimeType: "application/pdf",
              },
            ],
          },
        ],
      };
      assert.equal((await create(req("orders", "POST", payload))).status, 201);
      assert.equal(
        createMock.mock.calls.at(-1)?.arguments[0].data.deadlineAt,
        null
      );
      const calls = createMock.mock.callCount();
      for (const invalid of [
        { ...payload, urgency: "SCHEDULED" },
        { ...payload, urgency: "SCHEDULED", deadlineAt: "not-a-date" },
        { ...payload, deadlineAt: "not-a-date" },
      ])
        assert.equal(
          (await create(req("orders", "POST", invalid))).status,
          400
        );
      assert.equal(createMock.mock.callCount(), calls);
      const deadlineAt = "2026-10-04T08:00:00.000Z";
      assert.equal(
        (
          await create(
            req("orders", "POST", {
              ...payload,
              urgency: "SCHEDULED",
              deadlineAt,
            })
          )
        ).status,
        201
      );
      assert.equal(
        createMock.mock.calls.at(-1)?.arguments[0].data.deadlineAt,
        deadlineAt
      );
    }
  );
  await t.test(
    "administrator can read all, patch and delete; deadline remains a string",
    async () => {
      user.role = "ADMIN";
      assert.equal(
        (await (await list(req("orders?scope=all"))).json()).total,
        2
      );
      assert.equal((await details(req("orders/details?id=12"))).status, 200);
      const deadlineAt = "2026-10-04T08:00:00.000Z";
      assert.equal(
        (await PATCH(req("orders/details?id=11", "PATCH", { deadlineAt })))
          .status,
        200
      );
      assert.equal(
        updateMock.mock.calls.at(-1)?.arguments[0].data.deadlineAt,
        deadlineAt
      );
      assert.equal(
        (await DELETE(req("orders/details?id=11", "DELETE"))).status,
        200
      );
      assert.equal((await list(req("orders?page=-1"))).status, 400);
      assert.equal(
        (await details(req("orders/details?id=11oops"))).status,
        400
      );
      assert.equal(
        (await PATCH(req("orders/details?id=11", "PATCH", { userId: 999 })))
          .status,
        400
      );
    }
  );
});
