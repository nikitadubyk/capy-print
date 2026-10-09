import type { OrderStatus } from "@/app/generated/prisma/enums";

export interface StatusNotificationIdentity {
  provider: "TELEGRAM" | "VK";
  externalUserId: string;
  vkMessagesEnabled?: boolean | null;
}

export interface StatusNotificationOrder {
  id: number;
  status: OrderStatus;
  updatedAt: Date;
  user: {
    telegramId: bigint | string | null;
    identities?: readonly StatusNotificationIdentity[];
  };
}

export type NotificationResult =
  "sent" | "failed" | "skipped" | "unconfigured" | "denied";

export interface StaffNotificationResult {
  telegram: NotificationResult;
  vk: { peerId: number; result: NotificationResult }[];
}

export interface ReplyMarkup {
  inline_keyboard?: Array<
    Array<{
      text: string;
      callback_data?: string;
      url?: string;
      web_app?: { url: string };
    }>
  >;
}

export interface SendMessageParams {
  text: string;
  chatId: string | number;
  replyMarkup?: ReplyMarkup;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

export interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}
