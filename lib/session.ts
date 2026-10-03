import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { VerifiedMiniAppIdentity } from "@/types/mini-app-auth";
import type { SessionUser } from "@/types/session";

export const sessionHeaders = { "Cache-Control": "no-store" };
export const sessionUserSelect = {
  id: true,
  role: true,
  username: true,
  firstName: true,
  lastName: true,
  telegramId: true,
} as const;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readSessionToken(request: Request): string | null {
  const match = /^Bearer ((?:telegram|vk)_[A-Za-z0-9_-]{43})$/i.exec(
    request.headers.get("authorization") ?? ""
  );
  return match?.[1] ?? null;
}

const telegramProfileSchema = z.object({
  first_name: z.string().max(256).optional(),
  last_name: z.string().max(256).optional(),
  username: z.string().max(256).optional(),
  language_code: z.string().max(64).optional(),
  photo_url: z.string().max(2048).optional(),
  is_premium: z.boolean().optional(),
});

/** Call only after verifying the EXACT raw data. Never consume a client profile/body. */
export async function resolveSessionIdentity(
  identity: VerifiedMiniAppIdentity,
  rawLaunchData: string
) {
  const provider = identity.platform === "telegram" ? "TELEGRAM" : "VK";
  const key = { provider, externalUserId: identity.externalUserId } as const;

  if (identity.platform === "telegram") {
    const profile = telegramProfileSchema.parse(
      JSON.parse(new URLSearchParams(rawLaunchData).get("user")!)
    );
    const data = {
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      username: profile.username ?? null,
      languageCode: profile.language_code ?? null,
      photoUrl: profile.photo_url ?? null,
      isPremium: profile.is_premium ?? false,
    };
    // Keep legacy users, including Telegram users created by the webhook after backfill.
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(identity.externalUserId) },
      update: data,
      create: { telegramId: BigInt(identity.externalUserId), ...data },
    });
    try {
      return await prisma.userIdentity.upsert({
        where: { provider_externalUserId: key },
        update: {},
        create: { ...key, userId: user.id },
        include: { user: { select: sessionUserSelect } },
      });
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ))
        throw error;
      return prisma.userIdentity.findUniqueOrThrow({
        where: { provider_externalUserId: key },
        include: { user: { select: sessionUserSelect } },
      });
    }
  }

  try {
    return await prisma.userIdentity.upsert({
      where: { provider_externalUserId: key },
      update: {},
      create: { ...key, user: { create: {} } },
      include: { user: { select: sessionUserSelect } },
    });
  } catch (error) {
    // A concurrent nested create may hit the unique key; its transaction rolls back.
    if (!(
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ))
      throw error;
    return prisma.userIdentity.findUniqueOrThrow({
      where: { provider_externalUserId: key },
      include: { user: { select: sessionUserSelect } },
    });
  }
}

export function sessionUserDto(
  user: { telegramId: bigint | null } & Omit<SessionUser, "telegramId">
): SessionUser {
  return { ...user, telegramId: user.telegramId?.toString() ?? null };
}

export async function issueSession(
  identity: VerifiedMiniAppIdentity,
  rawLaunchData: string
) {
  const resolved = await resolveSessionIdentity(identity, rawLaunchData);
  const token = `${identity.platform}_${randomBytes(32).toString("base64url")}`;
  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), identityId: resolved.id },
  });
  return {
    token,
    platform: identity.platform,
    user: sessionUserDto(resolved.user),
  };
}

export async function getSession(request: Request) {
  const token = readSessionToken(request);
  if (!token) return null;
  return prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      identity: { provider: token.startsWith("telegram_") ? "TELEGRAM" : "VK" },
    },
    include: { identity: { include: { user: { select: sessionUserSelect } } } },
  });
}
