BEGIN;

ALTER TABLE "User" ADD COLUMN "completedOrdersCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- Preserve the previously granted first-order promotion; no retrospective loyalty discounts.
UPDATE "Order" SET "discountPercent" = 15 WHERE "isFirstOrder" = true;
UPDATE "User" AS u SET "completedOrdersCount" = (
  SELECT COUNT(*)::INTEGER FROM "Order" AS o
  WHERE o."userId" = u."id" AND o."status" = 'COMPLETED'
);

-- PROCESSING duplicated PRINTING. Preserve orders and avoid transport side effects during migration.
UPDATE "Order" SET "status" = 'PRINTING' WHERE "status" = 'PROCESSING';
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PRINTING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::text::"OrderStatus");
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_old";

ALTER TABLE "User" ADD CONSTRAINT "User_completedOrdersCount_check" CHECK ("completedOrdersCount" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountPercent_check" CHECK ("discountPercent" BETWEEN 0 AND 100);

COMMIT;
