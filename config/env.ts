const env = process.env;

export const Config = {
  botToken: env.TELEGRAM_BOT_TOKEN,
  baseUrl: env.NEXT_PUBLIC_BASE_URL,
  adminChatId: env.ADMIN_GROUP_CHAT_ID!,
  miniAppUrl: env.NEXT_PUBLIC_MINI_APP_URL,
};
