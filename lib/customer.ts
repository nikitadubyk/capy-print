import type { UserDTO } from "@/types";
import { CONTACT_URL } from "@/config/url";

// Include identity even for old VK users whose display profile is still empty.
export const orderUserSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  telegramId: true,
  identities: {
    select: { provider: true, externalUserId: true, vkMessagesEnabled: true },
  },
} as const;

export const getCustomerContact = (user: UserDTO) => {
  const identity =
    user.identities?.find((identity) => identity.provider === "VK") ??
    user.identities?.find((identity) => identity.provider === "TELEGRAM");
  const isVk = identity?.provider === "VK";
  const externalId = identity?.externalUserId ?? user.telegramId;
  const platform = isVk ? "ВКонтакте" : externalId ? "Telegram" : "Не указана";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Имя не указано";
  const hasExternalId = !!externalId && /^[1-9]\d*$/.test(String(externalId));
  const hasUsername = !!user.username && /^[A-Za-z0-9_]+$/.test(user.username);
  const vkProfileUrl = `${CONTACT_URL.VK_PROFILE}${externalId}`;
  const vkMessageUrl = `${CONTACT_URL.VK_MESSAGE}${externalId}`;
  const telegramProfileUrl = hasUsername
    ? `${CONTACT_URL.TELEGRAM_PROFILE}${user.username}`
    : `${CONTACT_URL.TELEGRAM_USER}${externalId}`;
  const profileUrl = hasExternalId
    ? isVk
      ? vkProfileUrl
      : telegramProfileUrl
    : null;
  const messageUrl = isVk && profileUrl ? vkMessageUrl : profileUrl;
  return { name, platform, externalId, profileUrl, messageUrl };
};
