import type { MiniAppPlatform } from "./mini-app-auth";

export interface SessionUser {
  id: number;
  role: "USER" | "ADMIN";
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramId: string | null;
}

export interface SessionResponse {
  token: string;
  platform: MiniAppPlatform;
  user: SessionUser;
}
