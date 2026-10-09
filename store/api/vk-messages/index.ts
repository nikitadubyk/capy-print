import { apiInstance } from "../instance";
import type { VkMessagesPermission } from "@/types/vk-messages";
import { URL } from "@/config/url";

export const key = ["vk-messages-permission"];

export const getVkMessagesPermission = async (signal?: AbortSignal) => {
  const { data } = await apiInstance.get<VkMessagesPermission>(
    URL.VK_MESSAGES_PERMISSION,
    { signal }
  );
  return data;
};

export const saveVkMessagesPreference = async (enabled: boolean) => {
  const { data } = await apiInstance.post<VkMessagesPermission>(
    URL.VK_MESSAGES_PERMISSION,
    { enabled }
  );
  return data;
};
