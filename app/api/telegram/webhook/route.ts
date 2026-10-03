import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { Config } from "@/config";
import { sendTelegramMessage } from "@/lib";

import { MAIN_MENU_KEYBOARD, BACK_KEYBOARD } from "./config";
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
} from "./types";

const handleStartCommand = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    parseMode: "Markdown",
    replyMarkup: MAIN_MENU_KEYBOARD,
    text: `🐹 Привет! Мы — капибары *Capy Print* и уже греем принтер 🔥🖨\n\nТы можешь отправить файлы на печать онлайн и забрать готовый заказ в нашем копицентре в Горловке.\n\nВыбери, что тебя интересует:`,
  });

const handleHoursCallback = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    parseMode: "Markdown",
    replyMarkup: BACK_KEYBOARD,
    text: `🕐 *Режим работы*\n
    📅 Вт–Пт: 8:00 – 13:30
    📅 Суббота: 8:00 – 12:00
    ❌ Понедельник: выходной\n
    Заказ через приложение принимается круглосуточно 🌙
    Исполнение — в рабочие часы.`,
  });

const handleAddressCallback = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    parseMode: "Markdown",
    replyMarkup: BACK_KEYBOARD,
    text: `📍 *Как нас найти*\n
    🏢 г. Горловка, ул. Изотова 7\n_(Центральный рынок)_\n
    🚶 Ориентир — торгорвый дом Донбасс (Стройленд), мы рядом.\n
    🗺 [Открыть в картах](https://maps.google.com/?q=Горловка+Изотова+7)`,
  });

const handleContactsCallback = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    parseMode: "Markdown",
    replyMarkup: BACK_KEYBOARD,
    text: `📞 *Контакты*\n
      💬 Написать нам:\n
      📘 [ВКонтакте](https://vk.com/kopibara24)
      📘 [Telegram](https://t.me/fotomail24)`,
  });

const handleFaqCallback = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    parseMode: "Markdown",
    replyMarkup: BACK_KEYBOARD,
    text: `❓ *Частые вопросы*\n
      *Какие форматы файлов поддерживаются?*
      PDF, JPG, PNG, DOCX и XLSX. Если файл нестандартный — попробуй сохранить его в PDF.\n
      *Можно ли печатать в цвете?*
      Да, цветная и черно-белая печать доступны при оформлении заказа.\n
      *Сколько времени занимает печать?*
      Обычно от 5 до 15 минут, в зависимости от количества страниц и загруженности нашей точки.\n
      *Как происходит оплата?*
      Оплата производится при получении заказа.\n
      *Где можно забрать заказ?*
      г. Горловка, ул. Изотова 7 (Центральный рынок).\n
      *Какой график работы?*
      Вт–Пт: 8:00 – 13:30
      Сб–Вс: 8:00 – 12:00
      Понедельник — выходной.`,
  });

const handleMainMenuCallback = (chatId: number) =>
  sendTelegramMessage({
    chatId,
    replyMarkup: MAIN_MENU_KEYBOARD,
    text: `🐹 Главное меню — выбери, что тебя интересует:`,
  });

const answerCallbackQuery = (callbackQueryId: string) =>
  axios.post(
    `https://api.telegram.org/bot${Config.botToken!}/answerCallbackQuery`,
    { callback_query_id: callbackQueryId }
  );

const processMessage = async (message: TelegramMessage) => {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text) return;

  const command = text.split(" ")[0].split("@")[0];

  switch (command) {
    case "/start":
      await handleStartCommand(chatId);
      break;

    default:
      if (!text.startsWith("/")) {
        await handleStartCommand(chatId);
      } else {
        await sendTelegramMessage({
          chatId,
          text: "Используй кнопки меню 👇",
          replyMarkup: MAIN_MENU_KEYBOARD,
        });
      }
      break;
  }
};

const processCallbackQuery = async (callbackQuery: TelegramCallbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) return;

  await answerCallbackQuery(callbackQuery.id);

  switch (callbackQuery.data) {
    case "hours":
      await handleHoursCallback(chatId);
      break;
    case "address":
      await handleAddressCallback(chatId);
      break;
    case "contacts":
      await handleContactsCallback(chatId);
      break;
    case "faq":
      await handleFaqCallback(chatId);
      break;
    case "main_menu":
      await handleMainMenuCallback(chatId);
      break;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: TelegramUpdate = await request.json();

    if (body.message) {
      await processMessage(body.message);
    }

    if (body.callback_query) {
      await processCallbackQuery(body.callback_query);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Ошибка обработки Telegram webhook:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Capy Print Telegram Bot Webhook",
  });
}
