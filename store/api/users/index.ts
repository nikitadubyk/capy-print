import type { SessionUser } from "@/types/session";
import type { VkProfile } from "@/types/vk-profile";
import { URL } from "@/config/url";
import { MINI_APP_STARTUP_TIMEOUT_MS } from "@/config/mini-app";
import { apiInstance } from "../instance";

export const key = ["users"];
export const usersApi = {
  updateVkProfile: async (profile: VkProfile) => {
    const { data } = await apiInstance.patch<{ user: SessionUser }>(
      URL.UPSERT_USER,
      {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        photo_200: profile.photo_200,
      },
      { timeout: MINI_APP_STARTUP_TIMEOUT_MS }
    );
    return data.user;
  },
  me: async () => {
    const { data } = await apiInstance.get<{ user: SessionUser }>(
      URL.UPSERT_USER
    );
    return data.user;
  },
};
