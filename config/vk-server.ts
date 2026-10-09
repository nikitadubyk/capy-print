import { z } from "zod";

const groupIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .refine(Number.isSafeInteger);

export const getVkMessagingConfig = () => {
  const groupId = groupIdSchema.safeParse(process.env.VK_GROUP_ID);
  const token = process.env.VK_GROUP_TOKEN?.trim();
  return groupId.success && token ? { groupId: groupId.data, token } : null;
};

export const vkPeerIdSchema = z
  .string()
  .trim()
  .regex(/^-?[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

export const getVkAdminPeerIds = () => {
  const raw = process.env.VK_ADMIN_PEER_IDS?.trim();
  if (!raw) return [];
  const parsed = z.array(vkPeerIdSchema).safeParse(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  return parsed.success ? [...new Set(parsed.data)] : null;
};
