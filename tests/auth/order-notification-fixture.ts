import type { TestContext } from "node:test";
import { Urgency, type Order } from "@/types";

export const notificationOrder: Order = {
  id: 62,
  status: "PENDING",
  urgency: Urgency.ASAP,
  createdAt: new Date("2026-10-08T15:26:00Z"),
  user: {
    id: 6,
    telegramId: null,
    firstName: "Анна <&>",
    lastName: "Иванова",
    username: null,
    identities: [{ provider: "VK", externalUserId: "516072459" }],
  },
  comment: "<b>Не теги</b>",
  printJobs: [
    {
      id: 1,
      copies: 1,
      isColor: false,
      duplex: false,
      paperSize: "A4Basic",
      files: [
        {
          id: 1,
          fileUrl: "https://example.test/file?a=1&b=2",
          fileName: "договор <&>.pdf",
          fileSize: 42,
        },
      ],
    },
  ],
};

// Explicitly synthetic configuration: tests neither load .env nor deliver real messages.
export const installNotificationEnv = (
  t: TestContext,
  overrides: Record<string, string | undefined> = {}
) => {
  const values: Record<string, string | undefined> = {
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ADMIN_GROUP_CHAT_ID: "-100123",
    VK_GROUP_ID: "123",
    VK_GROUP_TOKEN: "test-community-token",
    VK_ADMIN_PEER_IDS: "42,43",
    ...overrides,
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
};
