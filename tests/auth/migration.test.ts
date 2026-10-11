import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("cancellation reason migration preserves existing orders and stores reasons separately from customer comments", async () => {
  const db = new PGlite();
  try {
    const migration = "20261011020000_order_cancellation_reason";
    for (const entry of (
      await readdir("prisma/migrations", { withFileTypes: true })
    )
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name >= migration) break;
      await db.exec(
        await readFile(`prisma/migrations/${entry.name}/migration.sql`, "utf8")
      );
    }
    await db.exec(`INSERT INTO "User" ("updatedAt") VALUES (NOW());
      INSERT INTO "Order" ("userId", "status", "comment", "updatedAt") VALUES (1, 'CANCELLED', 'Комментарий клиента', NOW());`);
    await db.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8")
    );
    assert.deepEqual(
      (
        await db.query(
          `SELECT "status", "comment", "cancellationReason" FROM "Order"`
        )
      ).rows,
      [
        {
          status: "CANCELLED",
          comment: "Комментарий клиента",
          cancellationReason: null,
        },
      ]
    );
    await db.query(
      `UPDATE "Order" SET "cancellationReason" = $1 WHERE "id" = 1`,
      ["Файл повреждён"]
    );
    assert.deepEqual(
      (await db.query(`SELECT "comment", "cancellationReason" FROM "Order"`))
        .rows,
      [{ comment: "Комментарий клиента", cancellationReason: "Файл повреждён" }]
    );
  } finally {
    await db.close();
  }
});

test("loyalty migration preserves orders and first discounts, counts only COMPLETED and replaces PROCESSING safely", async () => {
  const db = new PGlite();
  try {
    const migration = "20261011010000_completed_order_loyalty";
    for (const entry of (
      await readdir("prisma/migrations", { withFileTypes: true })
    )
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name >= migration) break;
      await db.exec(
        await readFile(`prisma/migrations/${entry.name}/migration.sql`, "utf8")
      );
    }
    await db.exec(`INSERT INTO "User" ("updatedAt") VALUES (NOW()), (NOW());
      INSERT INTO "Order" ("userId", "status", "isFirstOrder", "updatedAt") VALUES
      (1, 'COMPLETED', true, NOW()), (1, 'COMPLETED', false, NOW()), (1, 'PROCESSING', false, NOW()),
      (1, 'CANCELLED', false, NOW()), (1, 'PENDING', false, NOW()), (2, 'COMPLETED', false, NOW());`);
    await db.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8")
    );
    assert.deepEqual(
      (
        await db.query(
          `SELECT "completedOrdersCount" FROM "User" ORDER BY "id"`
        )
      ).rows,
      [{ completedOrdersCount: 2 }, { completedOrdersCount: 1 }]
    );
    assert.deepEqual(
      (
        await db.query(
          `SELECT "status", "discountPercent" FROM "Order" ORDER BY "id"`
        )
      ).rows,
      [
        { status: "COMPLETED", discountPercent: 15 },
        { status: "COMPLETED", discountPercent: 0 },
        { status: "PRINTING", discountPercent: 0 },
        { status: "CANCELLED", discountPercent: 0 },
        { status: "PENDING", discountPercent: 0 },
        { status: "COMPLETED", discountPercent: 0 },
      ]
    );
    await assert.rejects(
      db.exec(`UPDATE "Order" SET "status" = 'PROCESSING' WHERE "id" = 1`)
    );
    await assert.rejects(
      db.exec(`UPDATE "User" SET "completedOrdersCount" = -1 WHERE "id" = 1`)
    );
    // Verify that the discount and counter commit atomically, without delivery side effects.
    await db.transaction(async (tx) => {
      assert.deepEqual(
        (
          await tx.query(
            `SELECT "completedOrdersCount" FROM "User" WHERE "id" = 1`
          )
        ).rows,
        [{ completedOrdersCount: 2 }]
      );
      await tx.exec(`UPDATE "Order" SET "status" = 'COMPLETED', "discountPercent" = 5 WHERE "id" = 3;
        UPDATE "User" SET "completedOrdersCount" = "completedOrdersCount" + 1 WHERE "id" = 1;`);
    });
    await assert.rejects(
      db.transaction(async (tx) => {
        await tx.exec(`UPDATE "User" SET "completedOrdersCount" = "completedOrdersCount" + 1 WHERE "id" = 1;
        UPDATE "Order" SET "discountPercent" = 101 WHERE "id" = 4;`);
      })
    );
    assert.deepEqual(
      (
        await db.query(
          `SELECT "completedOrdersCount" FROM "User" WHERE "id" = 1`
        )
      ).rows,
      [{ completedOrdersCount: 3 }]
    );
  } finally {
    await db.close();
  }
});

test("first-order migration preserves existing orders without granting retrospective discounts", async () => {
  const db = new PGlite();
  try {
    const migration = "20261011000000_first_order_discount";
    for (const entry of (
      await readdir("prisma/migrations", { withFileTypes: true })
    )
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name >= migration) break;
      await db.exec(
        await readFile(`prisma/migrations/${entry.name}/migration.sql`, "utf8")
      );
    }
    await db.exec(`INSERT INTO "User" ("updatedAt") VALUES (NOW());
      INSERT INTO "Order" ("userId", "updatedAt", "comment") VALUES (1, NOW(), 'Существующий заказ');`);
    await db.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8")
    );
    assert.deepEqual(
      (
        await db.query(
          `SELECT "userId", "comment", "isFirstOrder" FROM "Order"`
        )
      ).rows,
      [{ userId: 1, comment: "Существующий заказ", isFirstOrder: false }]
    );
    await db.exec(
      `INSERT INTO "Order" ("userId", "updatedAt", "isFirstOrder") VALUES (1, NOW(), true);`
    );
    assert.deepEqual(
      (await db.query(`SELECT "isFirstOrder" FROM "Order" ORDER BY "id"`)).rows,
      [{ isFirstOrder: false }, { isFirstOrder: true }]
    );
  } finally {
    await db.close();
  }
});

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
