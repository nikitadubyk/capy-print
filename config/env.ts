const env = process.env;

export const Config = {
  baseUrl: env.NEXT_PUBLIC_BASE_URL,
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  adminChatId: process.env.ADMIN_GROUP_CHAT_ID!,
  uploadthingToken: process.env.UPLOADTHING_TOKEN,
};
