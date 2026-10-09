export const URL = {
  UPSERT_USER: "user",
  CREATE_ORDER: "orders",
  ORDER_DETAILS: "orders/details",
  VK_MESSAGES_PERMISSION: "vk/messages/permission",
};

export const VK_API = {
  MESSAGES_PERMISSION:
    "https://api.vk.ru/method/messages.isMessagesFromGroupAllowed",
  MESSAGES_SEND: "https://api.vk.ru/method/messages.send",
  VERSION: "5.199",
  TIMEOUT: 10_000,
};

export const TELEGRAM_API = {
  BASE_URL: "https://api.telegram.org",
  TIMEOUT: 10_000,
};

export const CONTACT_URL = {
  VK_PROFILE: "https://vk.com/id",
  VK_MESSAGE: "https://vk.com/im?sel=",
  TELEGRAM_PROFILE: "https://t.me/",
  TELEGRAM_USER: "tg://user?id=",
};
