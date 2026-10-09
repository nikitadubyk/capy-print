import axios from "axios";
import { TELEGRAM_API } from "@/config/url";
import {
  notificationTransportCodes,
  telegramFailureReasons,
} from "@/config/notifications";
import type { SendMessageParams, TelegramResponse } from "./types";

const getApiErrorDetails = (data: TelegramResponse | undefined) => ({
  apiErrorCode: typeof data?.error_code === "number" ? data.error_code : null,
  reason:
    typeof data?.description === "string"
      ? (telegramFailureReasons.find(({ pattern }) =>
          pattern.test(data.description!)
        )?.reason ?? "api_error")
      : "unknown",
});

export const sendTelegramMessage = async ({
  text,
  chatId,
  replyMarkup,
  parseMode = "HTML",
}: SendMessageParams) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || chatId == null || !String(chatId).trim()) {
    console.error("Ошибка при отправке в Telegram:", { code: "config" });
    return false;
  }
  try {
    const { data } = await axios.post<TelegramResponse>(
      `${TELEGRAM_API.BASE_URL}/bot${token}/sendMessage`,
      {
        text,
        chat_id: chatId,
        parse_mode: parseMode,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      },
      { timeout: TELEGRAM_API.TIMEOUT }
    );
    if (!data.ok) {
      console.error(
        "Ошибка отправки Telegram сообщения:",
        getApiErrorDetails(data)
      );
      return false;
    }
    return true;
  } catch (error) {
    const transportError = axios.isAxiosError<TelegramResponse>(error)
      ? error
      : null;
    console.error("Ошибка при отправке в Telegram:", {
      status: transportError?.response?.status ?? null,
      code:
        transportError?.code &&
        notificationTransportCodes.has(transportError.code)
          ? transportError.code
          : "unknown",
      ...getApiErrorDetails(transportError?.response?.data),
    });
    return false;
  }
};
