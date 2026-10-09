import { z } from "zod";
import { VK_API } from "@/config/url";
import { getVkMessagingConfig, vkPeerIdSchema } from "@/config/vk-server";
import { callVkMessages } from "@/store/api/vk/server";
import { VkMessagingError } from "@/store/api/vk/types";

export { getVkMessagingConfig } from "@/config/vk-server";
export { VkMessagingError } from "@/store/api/vk/types";

const positiveId = z.coerce
  .number()
  .int()
  .positive()
  .refine(Number.isSafeInteger);

export const isVkMessagesAllowed = async (externalUserId: string) => {
  const config = getVkMessagingConfig();
  if (!config) throw new VkMessagingError("config");
  const userId = positiveId.parse(externalUserId);
  const data = await callVkMessages(VK_API.MESSAGES_PERMISSION, {
    group_id: String(config.groupId),
    user_id: String(userId),
  });
  const parsed = z
    .object({
      response: z.object({ is_allowed: z.union([z.literal(0), z.literal(1)]) }),
    })
    .safeParse(data);
  if (!parsed.success) throw new VkMessagingError("response");
  return parsed.data.response.is_allowed === 1;
};

const sendVkMessageToTarget = async (
  target: Record<string, string>,
  message: string,
  randomId: number
) => {
  const data = await callVkMessages(VK_API.MESSAGES_SEND, {
    ...target,
    message,
    random_id: String(randomId),
  });
  const parsed = z
    .object({ response: z.number().int().positive() })
    .safeParse(data);
  if (!parsed.success) throw new VkMessagingError("response");
  return parsed.data.response;
};

export const sendVkMessage = async (
  externalUserId: string,
  message: string,
  randomId: number
) =>
  sendVkMessageToTarget(
    { user_id: String(positiveId.parse(externalUserId)) },
    message,
    randomId
  );

// peer_id is already the full conversation ID; do not add 2e9 to an existing peer ID.
export const sendVkPeerMessage = async (
  peerId: number,
  message: string,
  randomId: number
) =>
  sendVkMessageToTarget(
    { peer_id: String(vkPeerIdSchema.parse(String(peerId))) },
    message,
    randomId
  );
