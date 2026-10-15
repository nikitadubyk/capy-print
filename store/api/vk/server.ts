import axios from "axios";
import { z } from "zod";
import { VK_API } from "@/config/url";
import { getVkMessagingConfig } from "@/config/vk-server";
import { VkMessagingError } from "./types";

const apiErrorSchema = z.object({
  error: z.object({ error_code: z.number().int() }),
});

const transportCodes = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "ERR_NETWORK",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

// Server transport. Never import into a client component: community token stays here.
export const callVkMessages = async (
  url: typeof VK_API.MESSAGES_PERMISSION | typeof VK_API.MESSAGES_SEND,
  params: Record<string, string>
) => {
  const method =
    url === VK_API.MESSAGES_SEND
      ? "messages.send"
      : "messages.isMessagesFromGroupAllowed";
  const config = getVkMessagingConfig();
  if (!config) throw new VkMessagingError("config", { method });
  const startedAt = Date.now();
  try {
    const { data, status } = await axios.post<unknown>(
      url,
      new URLSearchParams({ ...params, v: VK_API.VERSION }),
      {
        headers: { Authorization: `Bearer ${config.token}` },
        timeout: VK_API.TIMEOUT,
      }
    );
    const error = apiErrorSchema.safeParse(data);
    if (error.success)
      throw new VkMessagingError(error.data.error.error_code, {
        method,
        httpStatus: status,
        durationMs: Date.now() - startedAt,
      });
    return data;
  } catch (error) {
    // Axios errors and VK payloads can expose token/request parameters.
    if (error instanceof VkMessagingError) throw error;
    const httpStatus = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    const apiError = apiErrorSchema.safeParse(
      axios.isAxiosError(error) ? error.response?.data : undefined
    );
    const transportCode =
      axios.isAxiosError(error) && transportCodes.has(error.code ?? "")
        ? error.code
        : "unknown";
    throw new VkMessagingError(
      apiError.success ? apiError.data.error.error_code : "network",
      { method, httpStatus, transportCode, durationMs: Date.now() - startedAt }
    );
  }
};
