import assert from "node:assert/strict";
import { test } from "node:test";
import { installDatabaseStub } from "./database-stub";

test("VK profile updates the session owner without changing identity, role or orders", async (t) => {
  installDatabaseStub(t);
  const { prisma } = await import("@/lib/prisma");
  const { PATCH } = await import("@/app/api/user/route");
  const user = {
    id: 6,
    role: "USER",
    telegramId: null,
    username: null,
    firstName: null,
    lastName: null,
    photoUrl: null,
    orders: [{ id: 62 }],
  };
  const identity = { provider: "VK", externalUserId: "516072459", user };
  const session = t.mock.method(prisma.session, "findFirst", async () => ({
    identity,
  }));
  const update = t.mock.method(
    prisma.user,
    "update",
    async ({ where, data }: any) => {
      assert.deepEqual(where, { id: 6 });
      Object.assign(user, data);
      return user;
    }
  );
  const request = (body: unknown, authenticated = true) =>
    new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: authenticated
        ? { Authorization: `Bearer vk_${"a".repeat(43)}` }
        : {},
      body: JSON.stringify(body),
    });
  const profile = {
    id: 516072459,
    first_name: "Анна",
    last_name: "Иванова",
    photo_200: "https://example.test/avatar.jpg",
  };
  assert.equal((await PATCH(request(profile, false))).status, 401);
  assert.equal(session.mock.callCount(), 0);
  for (const invalid of [
    { ...profile, id: 42 },
    { ...profile, role: "ADMIN" },
    { ...profile, userId: 7 },
    { ...profile, telegramId: "42" },
    { ...profile, first_name: "" },
    { ...profile, photo_200: "javascript:alert(1)" },
    { ...profile, id: Number.MAX_SAFE_INTEGER + 1 },
  ])
    assert.ok([400, 403].includes((await PATCH(request(invalid))).status));
  identity.provider = "TELEGRAM";
  assert.equal((await PATCH(request(profile))).status, 403);
  identity.provider = "VK";
  assert.equal(update.mock.callCount(), 0);
  const response = await PATCH(request(profile));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).user.firstName, "Анна");
  assert.equal(user.lastName, "Иванова");
  assert.equal(user.photoUrl, profile.photo_200);
  assert.equal(user.telegramId, null);
  assert.equal(user.role, "USER");
  assert.deepEqual(user.orders, [{ id: 62 }]);
  assert.equal(identity.externalUserId, "516072459");
  assert.equal(
    (
      await PATCH(
        request({
          id: profile.id,
          first_name: "Анна",
          last_name: "Новая фамилия",
        })
      )
    ).status,
    200
  );
  assert.equal(user.photoUrl, profile.photo_200);
  assert.equal(update.mock.callCount(), 2);
  update.mock.mockImplementation(async () => {
    throw new Error("Database unavailable");
  });
  assert.equal((await PATCH(request(profile))).status, 500);
});
