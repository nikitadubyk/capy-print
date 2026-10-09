import axios from "axios";
import { z } from "zod";
import { VK_API } from "@/config/url";
import { getVkMessagingConfig } from "@/config/vk-server";
import { VkMessagingError } from "./types";

// Server transport. Never import into a client component: community token stays here.
export const callVkMessages = async (
  url: typeof VK_API.MESSAGES_PERMISSION | typeof VK_API.MESSAGES_SEND,
  params: Record<string, string>
) => {
  const config = getVkMessagingConfig();
  if (!config) throw new VkMessagingError("config");
  try {
    const { data } = await axios.post<unknown>(
      url,
      new URLSearchParams({ ...params, v: VK_API.VERSION }),
      {
        headers: { Authorization: `Bearer ${config.token}` },
        timeout: VK_API.TIMEOUT,
      }
    );
    const error = z
      .object({ error: z.object({ error_code: z.number() }) })
      .safeParse(data);
    if (error.success) throw new VkMessagingError(error.data.error.error_code);
    return data;
  } catch (error) {
    // Axios errors and VK payloads can expose token/request parameters.
    if (error instanceof VkMessagingError) throw error;
    throw new VkMessagingError("network");
  }
};
