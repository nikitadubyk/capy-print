import dayjs from "dayjs";
import axios, { AxiosResponse } from "axios";

import { Config } from "@/config";
import { Urgency, Order, PaperSizeTitle } from "@/types";

interface ReplyMarkup {
  inline_keyboard?: Array<
    Array<{
      text: string;
      callback_data?: string;
      url?: string;
      web_app?: {
        url: string;
      };
    }>
  >;
}

interface SendMessageParams {
  text: string;
  chatId: string | number;
  replyMarkup?: ReplyMarkup;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

interface FileToSend {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
}

interface TelegramResponse<T = any> {
  ok: boolean;
  result?: T;
  description?: string;
}

const format = "DD.MM.YYYY HH:mm";

export async function sendTelegramMessage({
  text,
  chatId,
  replyMarkup,
  parseMode = "HTML",
}: SendMessageParams) {
  try {
    const { data }: AxiosResponse<TelegramResponse> = await axios.post(
      `https://api.telegram.org/bot${Config.botToken}/sendMessage`,
      {
        text,
        chat_id: chatId,
        parse_mode: parseMode,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }
    );

    if (!data.ok) {
      console.error("Ошибка отправки Telegram сообщения:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка при отправке в Telegram:", error);
    return false;
  }
}

export const formatOrderNotification = (order: Order): string => {
  const urgencyText =
    order.urgency === Urgency.ASAP ? "🔴 СРОЧНО" : "📅 Запланирован";

  let message = `
    <b>Новый заказ #${order.id}</b>

    ${urgencyText}
    👤 Клиент: ${order.user.firstName} ${order.user.lastName || ""}
    📱 Username: @${order.user.username || "не указан"}

    📋 <b>Детали заказа:</b>
  `;

  order.printJobs.forEach((job, index) => {
    message += `
      <b>Набор ${index + 1}:</b>
      - Копий: ${job.copies}
      - Цветная: ${job.isColor ? "Да" : "Нет"}
      - Размер: ${PaperSizeTitle[job.paperSize || ""]}
      - Двухсторонняя печать: ${job.duplex ? "Да" : "Нет"}
      - Файлов: ${job.files.length}
      📎 <b>Файлы:</b>
        ${job.files
          .map(
            (file, i) =>
              `${i + 1}. <a href="${file.fileUrl}">${file.fileName}</a>`
          )
          .join("\n")}
    `;
  });

  if (order.comment) {
    message += `\n💬 Комментарий: ${order.comment}`;
  }

  if (order.deadlineAt) {
    message += `\n⏰ Дедлайн: ${dayjs(order.deadlineAt).format(format)}`;
  }

  message += `\n\n📅 Создан: ${dayjs(order.createdAt).format(format)}`;

  return message;
};

export const sendOrderNotification = async (
  order: Order,
  chatId: string | number
) => {
  const message = formatOrderNotification(order);
  await sendTelegramMessage({ chatId, text: message });

  const allFiles: FileToSend[] = [];

  order.printJobs.forEach((job) => {
    job.files.forEach((file) => {
      allFiles.push({
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        mimeType: file.mimeType,
      });
    });
  });

  return true;
};
