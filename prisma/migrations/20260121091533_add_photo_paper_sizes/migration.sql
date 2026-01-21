/*
  Warnings:

  - The values [READY] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'PRINTING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaperSize" ADD VALUE 'A4PhotoMatte';
ALTER TYPE "PaperSize" ADD VALUE 'A4PhotoGlossy';
ALTER TYPE "PaperSize" ADD VALUE 'A5PhotoMatte';
ALTER TYPE "PaperSize" ADD VALUE 'A5PhotoGlossy';
ALTER TYPE "PaperSize" ADD VALUE 'A6PhotoMatte';
ALTER TYPE "PaperSize" ADD VALUE 'A6PhotoGlossy';
