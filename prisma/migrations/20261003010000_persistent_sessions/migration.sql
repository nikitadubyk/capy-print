BEGIN;
DROP INDEX "Session_expiresAt_idx";
ALTER TABLE "Session" DROP COLUMN "expiresAt";
COMMIT;
