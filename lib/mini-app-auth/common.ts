import type { MiniAppAuthErrorCode } from "@/types/mini-app-auth";

export const MAX_LAUNCH_DATA_BYTES = 16 * 1024;
export const DEFAULT_MAX_AGE_SECONDS = 300;
export const DEFAULT_CLOCK_SKEW_SECONDS = 30;

export class MiniAppAuthError extends Error {
  readonly code: MiniAppAuthErrorCode;

  constructor(code: MiniAppAuthErrorCode) {
    // Never include credentials, signatures or secrets in errors.
    super(code);
    this.name = "MiniAppAuthError";
    this.code = code;
  }
}

export function invalidLaunchData(): never {
  throw new MiniAppAuthError("INVALID_LAUNCH_DATA");
}

export function positiveDecimal(value: string | null): string {
  if (!value || !/^[1-9]\d*$/.test(value)) return invalidLaunchData();
  return value;
}

export function checkTimestamp(value: string | null, nowSeconds: number) {
  const issuedAt = Number(positiveDecimal(value));
  if (!Number.isSafeInteger(issuedAt)) return invalidLaunchData();
  if (issuedAt > nowSeconds + DEFAULT_CLOCK_SKEW_SECONDS) {
    throw new MiniAppAuthError("LAUNCH_DATA_IN_FUTURE");
  }
  const expiresAt = issuedAt + DEFAULT_MAX_AGE_SECONDS;
  if (nowSeconds >= expiresAt) {
    throw new MiniAppAuthError("LAUNCH_DATA_EXPIRED");
  }
  return { issuedAt, expiresAt };
}
