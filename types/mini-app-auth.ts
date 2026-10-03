/** Launch credentials are sent only to the authentication boundary. */
export type MiniAppPlatform = "telegram" | "vk";

export interface MiniAppAuthRequest {
  platform: MiniAppPlatform;
  rawLaunchData: string;
}

/** External identity, NOT a database User, role, session or bearer token. */
export interface VerifiedMiniAppIdentity {
  platform: MiniAppPlatform;
  externalUserId: string;
  issuedAt: number;
  expiresAt: number;
}

export type MiniAppAuthErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_LAUNCH_DATA"
  | "LAUNCH_DATA_EXPIRED"
  | "LAUNCH_DATA_IN_FUTURE"
  | "UNEXPECTED_APP"
  | "AUTH_NOT_CONFIGURED"
  | "INTERNAL_ERROR";

export type MiniAppAuthResponse =
  | { identity: VerifiedMiniAppIdentity }
  | { error: { code: MiniAppAuthErrorCode; message: string } };
