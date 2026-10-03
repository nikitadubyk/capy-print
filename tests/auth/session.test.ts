import assert from "node:assert/strict";
import { test } from "node:test";
import { installDatabaseStub } from "./database-stub";
import { APP_ID, APP_SECRET, BOT_TOKEN, telegram, vk } from "./fixtures";

test("server sessions: verified identity, prefixed tokens, persistence, role and revocation", async (t) => {
  installDatabaseStub(t);
  const { prisma } = await import("@/lib/prisma");
  const { POST, GET, DELETE } = await import("@/app/api/auth/session/route");
  const { requireRole } = await import("@/lib/auth");
  const { hashSessionToken } = await import("@/lib/session");
  const env = ["TELEGRAM_BOT_TOKEN", "VK_APP_ID", "VK_APP_SECRET"] as const;
  const original = env.map((key) => process.env[key]);
  t.after(() =>
    env.forEach((key, i) => {
      if (original[i] === undefined) delete process.env[key];
      else process.env[key] = original[i];
    })
  );
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  process.env.VK_APP_ID = APP_ID;
  process.env.VK_APP_SECRET = APP_SECRET;
  const now = Math.floor(Date.now() / 1000);
  const users = new Map<string, any>();
  const identities = new Map<string, any>();
  const sessions = new Map<string, any>();
  // A pre-existing Telegram administrator retains their internal ID and role.
  users.set("42", {
    id: 7,
    role: "ADMIN",
    telegramId: BigInt(42),
    username: null,
    firstName: "Старое имя",
    lastName: null,
  });
  let nextUserId = 8;
  t.mock.method(
    prisma.user,
    "upsert",
    async ({ where, create, update }: any) => {
      const key = String(where.telegramId);
      const user = users.get(key) ?? {
        id: nextUserId++,
        role: "USER",
        ...create,
      };
      Object.assign(user, update);
      users.set(key, user);
      return user;
    }
  );
  t.mock.method(
    prisma.userIdentity,
    "upsert",
    async ({ where, create }: any) => {
      const key = JSON.stringify(where.provider_externalUserId);
      if (!identities.has(key)) {
        const user = create.userId
          ? [...users.values()].find((u) => u.id === create.userId)
          : {
              id: nextUserId++,
              role: "USER",
              telegramId: null,
              username: null,
              firstName: null,
              lastName: null,
            };
        identities.set(key, {
          id: identities.size + 1,
          ...where.provider_externalUserId,
          user,
        });
      }
      return identities.get(key);
    }
  );
  t.mock.method(prisma.session, "create", async ({ data }: any) => {
    const identity = [...identities.values()].find(
      (i) => i.id === data.identityId
    );
    const session = { ...data, identity };
    sessions.set(data.tokenHash, session);
    return session;
  });
  t.mock.method(prisma.session, "findFirst", async ({ where }: any) => {
    const session = sessions.get(where.tokenHash);
    return session?.identity.provider === where.identity.provider
      ? session
      : null;
  });
  t.mock.method(prisma.session, "deleteMany", async ({ where }: any) => ({
    count: Number(sessions.delete(where.tokenHash)),
  }));
  const req = (authorization?: string, body?: string) =>
    new Request("http://localhost/api/auth/session?telegramId=999", {
      method: body ? "POST" : "GET",
      body,
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        "x-telegram-id": "999",
      },
    });

  let tg: any;
  await t.test(
    "Telegram session uses signed profile and preserves existing account",
    async () => {
      const response = await POST(
        req(
          `telegram ${telegram({ auth_date: String(now), user: '{"id":42,"first_name":"Проверенное имя"}' })}`,
          '{"id":999,"role":"ADMIN"}'
        )
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("cache-control"), "no-store");
      tg = await response.json();
      assert.equal(tg.user.id, 7);
      assert.equal(tg.user.role, "ADMIN");
      assert.equal(tg.user.firstName, "Проверенное имя");
      assert.equal(tg.user.telegramId, "42");
      assert.match(tg.token, /^telegram_[\w-]{43}$/);
      assert.equal(sessions.has(tg.token), false);
      assert.ok(sessions.has(hashSessionToken(tg.token)));
      assert.equal("expiresAt" in tg, false);
      assert.equal("tokenHash" in tg, false);
    }
  );
  await t.test(
    "VK with the same ID gets a separate USER account; repeat login creates no users",
    async () => {
      const credential = `vk ${vk({ vk_ts: String(now), vk_user_id: "42" })}`;
      const first = await (await POST(req(credential))).json();
      const second = await (await POST(req(credential))).json();
      assert.notEqual(first.user.id, tg.user.id);
      assert.equal(first.user.telegramId, null);
      assert.equal(first.user.role, "USER");
      assert.equal(second.user.id, first.user.id);
      assert.notEqual(second.token, first.token);
      assert.equal(identities.size, 2);
      assert.match(first.token, /^vk_[\w-]{43}$/);
      assert.equal((await GET(req(`Bearer ${first.token}`))).status, 200);
      assert.equal(
        (await GET(req(`Bearer ${first.token.replace(/^vk_/, "telegram_")}`)))
          .status,
        401
      );
    }
  );
  await t.test(
    "business authorization rejects raw launch data, IDs, cookies and forged tokens",
    async () => {
      for (const credential of [
        undefined,
        "Bearer 42",
        `Bearer ${"x".repeat(43)}`,
        `telegram ${telegram({ auth_date: String(now) })}`,
      ]) {
        const response = await GET(req(credential));
        assert.equal(response.status, 401);
        const auth = await requireRole(req(credential), "USER");
        assert.ok(auth instanceof Response);
        assert.equal(auth.status, 401);
      }
      const cookieRequest = new Request("http://localhost/api/auth/session", {
        headers: { Cookie: `session=${tg.token}` },
      });
      assert.equal((await GET(cookieRequest)).status, 401);
    }
  );
  await t.test(
    "session stays valid after 90 days; roles are read again from DB",
    async () => {
      t.mock.timers.enable({
        apis: ["Date"],
        now: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });
      const request = req(`Bearer ${tg.token}`);
      assert.equal((await GET(request)).status, 200);
      users.get("42").role = "USER";
      const denied = await requireRole(request, "ADMIN");
      assert.ok(denied instanceof Response);
      assert.equal(denied.status, 403);
      assert.equal((await (await GET(request)).json()).user.role, "USER");
      t.mock.timers.reset();
    }
  );
  await t.test("explicit revocation rejects reuse", async () => {
    assert.equal((await DELETE(req(`Bearer ${tg.token}`))).status, 204);
    assert.equal((await GET(req(`Bearer ${tg.token}`))).status, 401);
    assert.equal((await DELETE(req(`Bearer ${tg.token}`))).status, 204);
  });
  await t.test(
    "tampered/expired/wrong-app launch data creates neither user nor session",
    async () => {
      const counts = [users.size, identities.size, sessions.size];
      for (const credential of [
        "telegram invalid",
        `vk ${vk({ vk_ts: String(now - 301) })}`,
        `vk ${vk({ vk_ts: String(now), vk_app_id: "999" })}`,
      ]) {
        assert.equal((await POST(req(credential))).status, 401);
      }
      assert.deepEqual([users.size, identities.size, sessions.size], counts);
    }
  );
});
