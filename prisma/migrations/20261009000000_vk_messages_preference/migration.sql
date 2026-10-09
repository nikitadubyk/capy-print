-- NULL: no choice yet; true: opted in; false: declined. Existing identities are preserved.
ALTER TABLE "UserIdentity" ADD COLUMN "vkMessagesEnabled" BOOLEAN;
