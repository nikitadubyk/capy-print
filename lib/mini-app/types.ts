import type { MiniAppPlatform } from "@/types/mini-app-auth";

export interface MiniAppAdapter {
  platform: MiniAppPlatform;
  initialize(): Promise<string>;
}
