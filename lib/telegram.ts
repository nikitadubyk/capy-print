import dayjs from "dayjs";
import axios, { AxiosResponse } from "axios";

import { Config } from "@/config";
import { Urgency, Order } from "@/types";

interface SendMessageParams {
  text: string;
  chatId: string | number;
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

export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "HTML",
}: SendMessageParams) {
  try {
    const { data }: AxiosResponse<TelegramResponse> = await axios.post(
      `https://api.telegram.org/bot${Config.botToken}/sendMessage`,
      {
        text,
        chat_id: chatId,
        parse_mode: parseMode,
      },
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
    👤 Клиент: ${order.user.first_name} ${order.user.last_name || ""}
    📱 Username: @${order.user.username || "не указан"}

    📋 <b>Детали заказа:</b>
  `;

  order.printJobs.forEach((job, index) => {
    message += `
      <b>Набор ${index + 1}:</b>
      - Копий: ${job.copies}
      - Цветная: ${job.isColor ? "Да" : "Нет"}
      - Размер: ${job.paperSize}
      - Двухсторонняя печать: ${job.duplex ? "Да" : "Нет"}
      - Файлов: ${job.files.length}
      📎 <b>Файлы:</b>
        ${job.files
          .map(
            (file, i) =>
              `${i + 1}. <a href="${file.fileUrl}">${file.fileName}</a>`,
          )
          .join("\n")}
    `;
  });

  if (order.comment) {
    message += `\n💬 Комментарий: ${order.comment}`;
  }

  if (order.deadlineAt) {
    message += `\n⏰ Дедлайн: ${order.deadlineAt}`;
  }

  message += `\n\n📅 Создан: ${dayjs(order.createdAt).format("DD/MM/YYYY")}`;

  return message;
};

export const sendDocument = async ({
  chatId,
  fileUrl,
  caption,
}: {
  fileUrl: string;
  caption?: string;
  chatId: string | number;
}) => {
  try {
    const { data }: AxiosResponse<TelegramResponse> = await axios.post(
      `https://api.telegram.org/bot${Config.botToken}/sendDocument`,
      {
        chat_id: chatId,
        document: fileUrl,
        caption,
        parse_mode: "HTML",
      },
    );

    return data.ok;
  } catch (error) {
    console.error("Ошибка при отправке документа:", error);
    return false;
  }
};

export const sendDocuments = async ({
  files,
  chatId,
}: {
  files: FileToSend[];
  chatId: string | number;
}) => {
  try {
    const mediaGroup = files.slice(0, 10).map((file) => ({
      type: "document" as const,
      media: file.fileUrl,
    }));

    const { data }: AxiosResponse<TelegramResponse> = await axios.post(
      `https://api.telegram.org/bot${Config.botToken}/sendMediaGroup`,
      {
        chat_id: chatId,
        media: mediaGroup,
      },
    );

    return data.ok;
  } catch (error) {
    console.error("Ошибка при отправке группы документов:", error);
    return false;
  }
};

export const sendOrderNotification = async (
  order: Order,
  chatId: string | number,
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

  if (allFiles.length <= 10) {
    await sendDocuments({ chatId, files: allFiles });
  } else {
    for (let i = 0; i < allFiles.length; i += 10) {
      const batch = allFiles.slice(i, i + 10);
      await sendDocuments({ chatId, files: batch });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return true;
};
