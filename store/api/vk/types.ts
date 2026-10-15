export type VkMessagesMethod =
  "messages.isMessagesFromGroupAllowed" | "messages.send";

export interface VkMessagingErrorDetails {
  method?: VkMessagesMethod;
  httpStatus?: number;
  transportCode?: string;
  durationMs?: number;
}

export class VkMessagingError extends Error {
  constructor(
    public readonly code:
      number | "network" | "response" | "config" | "recipient",
    public readonly details: VkMessagingErrorDetails = {}
  ) {
    super("Не удалось выполнить запрос к сообщениям VK");
  }
}
