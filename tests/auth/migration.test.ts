import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("SQL migration preserves Telegram IDs, roles and order ownership and isolates VK", async () => {
  const db = new PGlite(); // Isolated PostgreSQL WASM; never reads DATABASE_URL.
  try {
    const migration = "20261003000000_mini_app_sessions";
    for (const entry of (
      await readdir("prisma/migrations", { withFileTypes: true })
    )
      .filter((e) => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name >= migration) break;
      await db.exec(
        await readFile(`prisma/migrations/${entry.name}/migration.sql`, "utf8")
      );
    }
    await db.exec(`INSERT INTO "User" ("telegramId", "updatedAt", "role") VALUES (9007199254740993, NOW(), 'ADMIN');
      INSERT INTO "Order" ("userId", "updatedAt") VALUES (1, NOW());`);
    await db.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8")
    );
    const beforeVk =
      await db.query(`SELECT u."id", u."role", u."telegramId"::text AS "telegramId", o."userId", i."provider", i."externalUserId"
      FROM "User" u JOIN "Order" o ON o."userId" = u."id" JOIN "UserIdentity" i ON i."userId" = u."id"`);
    assert.deepEqual(beforeVk.rows, [
      {
        id: 1,
        role: "ADMIN",
        telegramId: "9007199254740993",
        userId: 1,
        provider: "TELEGRAM",
        externalUserId: "9007199254740993",
      },
    ]);
    await db.exec(`INSERT INTO "User" ("updatedAt") VALUES (NOW());
      INSERT INTO "UserIdentity" ("provider", "externalUserId", "userId") VALUES ('VK', '9007199254740993', 2);`);
    assert.deepEqual(
      (
        await db.query(
          `SELECT "id", "role", "telegramId" FROM "User" WHERE "id" = 2`
        )
      ).rows,
      [{ id: 2, role: "USER", telegramId: null }]
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO "UserIdentity" ("provider", "externalUserId", "userId") VALUES ('VK', '9007199254740993', 2)`
      )
    );
    await db.exec(
      `INSERT INTO "Session" ("tokenHash", "identityId", "expiresAt") VALUES ('test-hash', 2, NOW() - INTERVAL '1 hour');`
    );
    await db.exec(
      await readFile(
        "prisma/migrations/20261003010000_persistent_sessions/migration.sql",
        "utf8"
      )
    );
    assert.deepEqual(
      (await db.query(`SELECT "tokenHash", "identityId" FROM "Session"`)).rows,
      [{ tokenHash: "test-hash", identityId: 2 }]
    );
    assert.equal(
      (
        await db.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'Session' AND column_name = 'expiresAt'`
        )
      ).rows.length,
      0
    );
    await db.exec(`DELETE FROM "User" WHERE "id" = 2;`);
    assert.equal((await db.query(`SELECT * FROM "Session"`)).rows.length, 0);
    assert.equal((await db.query(`SELECT * FROM "Order"`)).rows.length, 1);
  } finally {
    await db.close();
  }
});
