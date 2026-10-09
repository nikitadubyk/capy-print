export class VkMessagingError extends Error {
  constructor(
    public readonly code: number | "network" | "response" | "config"
  ) {
    super("Не удалось выполнить запрос к сообщениям VK");
  }
}
