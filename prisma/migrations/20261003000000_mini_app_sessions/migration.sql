-- Preserve existing User IDs, roles, orders and Telegram IDs.
BEGIN;
ALTER TABLE "User" ALTER COLUMN "telegramId" DROP NOT NULL;
CREATE TYPE "IdentityProvider" AS ENUM ('TELEGRAM', 'VK');
CREATE TABLE "UserIdentity" (
    "id" SERIAL NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserIdentity_provider_externalUserId_key" ON "UserIdentity"("provider", "externalUserId");
CREATE INDEX "UserIdentity_userId_idx" ON "UserIdentity"("userId");
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "UserIdentity" ("provider", "externalUserId", "userId")
SELECT 'TELEGRAM', "telegramId"::text, "id" FROM "User" WHERE "telegramId" IS NOT NULL;
CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL,
    "identityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);
CREATE INDEX "Session_identityId_idx" ON "Session"("identityId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
ALTER TABLE "Session" ADD CONSTRAINT "Session_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "UserIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
