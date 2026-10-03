import { verifyLaunchParams } from "vk-launch-params";
import type { VerifiedMiniAppIdentity } from "@/types/mini-app-auth";
import {
  checkTimestamp,
  invalidLaunchData,
  MiniAppAuthError,
  positiveDecimal,
} from "@/lib/mini-app-auth/common";

export function verifyVkLaunchData(
  params: URLSearchParams,
  appId: string,
  appSecret: string,
  nowSeconds: number
): VerifiedMiniAppIdentity {
  // VK keys are not encoded in the signing string; reject injected separators.
  if (
    [...params.keys()].some(
      (key) => key.startsWith("vk_") && !/^vk_\w+$/.test(key)
    )
  ) {
    return invalidLaunchData();
  }
  // The library signs every supplied key; VK signs only vk_* (plus separate sign).
  const signedParams = new URLSearchParams(
    [...params].filter(([key]) => key.startsWith("vk_") || key === "sign")
  );
  if (!verifyLaunchParams(signedParams.toString(), appSecret))
    return invalidLaunchData();
  if (positiveDecimal(params.get("vk_app_id")) !== appId) {
    throw new MiniAppAuthError("UNEXPECTED_APP");
  }
  const timestamps = checkTimestamp(params.get("vk_ts"), nowSeconds);
  return {
    platform: "vk",
    externalUserId: positiveDecimal(params.get("vk_user_id")),
    ...timestamps,
  };
}
