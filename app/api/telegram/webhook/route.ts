import { NextRequest, NextResponse } from "next/server";

import { Config } from "@/config";
import { sendTelegramMessage } from "@/lib";

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
}

interface TelegramMessage {
  date: number;
  text?: string;
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const handleStartCommand = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    text: `🐹 Привет! Мы — капибары Capy Print и уже греем принтер 🔥🖨
Ты можешь отправить файлы на печать онлайн
и забрать готовый заказ в нашем копицентре в Горловке.`,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "Открыть приложение",
            web_app: { url: Config.miniAppUrl! },
          },
        ],
      ],
    },
  });

const handleHelpCommand = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    text: `ℹ️ Как это работает:
    1. Нажми «Открыть приложение»
    2. Загрузи файлы
    3. Забери печать в копицентре`,
  });

const handleOpenCommand = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    text: "Открываю приложение 🐹",
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "Открыть приложение",
            web_app: { url: Config.miniAppUrl! },
          },
        ],
      ],
    },
  });

const processMessage = async (message: TelegramMessage) => {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text) {
    return;
  }

  const command = text.split(" ")[0].split("@")[0];

  switch (command) {
    case "/start":
      await handleStartCommand(chatId);
      break;

    case "/help":
      await handleHelpCommand(chatId);
      break;

    case "/open":
      await handleOpenCommand(chatId);
      break;

    default:
      if (text.startsWith("/")) {
        await sendTelegramMessage({
          chatId,
          text: "Неизвестная команда. Используйте /help для получения информации.",
        });
      }
      break;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: TelegramUpdate = await request.json();

    if (body.message) {
      await processMessage(body.message);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Ошибка обработки Telegram webhook:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Capy Print Telegram Bot Webhook",
  });
}
