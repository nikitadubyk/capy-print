import { validate } from "@tma.js/init-data-node";
import { z } from "zod";

import type { VerifiedMiniAppIdentity } from "@/types/mini-app-auth";
import { checkTimestamp, invalidLaunchData } from "@/lib/mini-app-auth/common";

const userSchema = z.object({ id: z.number().int().positive() });

export function verifyTelegramLaunchData(
  params: URLSearchParams,
  botToken: string,
  nowSeconds: number
): VerifiedMiniAppIdentity {
  // LF separates signed fields: disallow injected field separators.
  if (
    [...params].some(
      ([key, value]) => /[=\r\n]/.test(key) || /[\r\n]/.test(value)
    )
  ) {
    return invalidLaunchData();
  }
  let user: { id: number };
  try {
    // Shared timestamp validation below also rejects future launch data.
    validate(params, botToken, { expiresIn: 0 });
    user = userSchema.parse(JSON.parse(params.get("user") ?? "null"));
  } catch {
    return invalidLaunchData();
  }
  return {
    platform: "telegram",
    externalUserId: String(user.id),
    ...checkTimestamp(params.get("auth_date"), nowSeconds),
  };
}
