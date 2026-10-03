import { z } from "zod";

import type { VerifiedMiniAppIdentity } from "@/types/mini-app-auth";
import {
  MAX_LAUNCH_DATA_BYTES,
  MiniAppAuthError,
} from "@/lib/mini-app-auth/common";
import { verifyTelegramLaunchData } from "@/lib/mini-app-auth/telegram";
import { verifyVkLaunchData } from "@/lib/mini-app-auth/vk";

export interface MiniAppAuthConfig {
  telegram?: { botToken: string };
  vk?: { appId: string; appSecret: string };
}

const credentialsSchema = z
  .object({
    platform: z.enum(["telegram", "vk"]),
    rawLaunchData: z
      .string()
      .min(1)
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= MAX_LAUNCH_DATA_BYTES
      ),
  })
  .strict();

/** Server-only: chooses a verifier; never treats the platform label as proof. */
export function verifyMiniAppAuth(
  input: unknown,
  config: MiniAppAuthConfig,
  nowSeconds = Math.floor(Date.now() / 1000)
): VerifiedMiniAppIdentity {
  const result = credentialsSchema.safeParse(input);
  if (!result.success) throw new MiniAppAuthError("INVALID_REQUEST");

  const { platform, rawLaunchData } = result.data;
  const params = new URLSearchParams(rawLaunchData);
  // A signed key must have one meaning for verification and consumption.
  if (new Set(params.keys()).size !== params.size) {
    throw new MiniAppAuthError("INVALID_LAUNCH_DATA");
  }
  params.sort();

  if (platform === "telegram") {
    if (!config.telegram?.botToken.trim()) {
      throw new MiniAppAuthError("AUTH_NOT_CONFIGURED");
    }
    return verifyTelegramLaunchData(
      params,
      config.telegram.botToken,
      nowSeconds
    );
  }

  if (!config.vk?.appSecret.trim() || !/^[1-9]\d*$/.test(config.vk.appId)) {
    throw new MiniAppAuthError("AUTH_NOT_CONFIGURED");
  }
  return verifyVkLaunchData(
    params,
    config.vk.appId,
    config.vk.appSecret,
    nowSeconds
  );
}
