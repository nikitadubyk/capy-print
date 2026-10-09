import type { MiniAppPlatform } from "@/types/mini-app-auth";
import type { VkProfile } from "@/types/vk-profile";

export interface MiniAppAdapter {
  platform: MiniAppPlatform;
  initialize(): Promise<string>;
  getProfile?(): Promise<VkProfile>;
  allowMessagesFromGroup?(groupId: number): Promise<boolean>;
}
