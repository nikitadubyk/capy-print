import { getVkMessagingConfigDiagnostics } from "@/config/vk-server";
import { VkMessagingError } from "@/store/api/vk/types";

// Fixed descriptions, never error_msg/request_params from VK or Axios config.
// Codes: https://github.com/VKCOM/vk-api-schema/blob/master/errors.json
const errorReasons: Record<number | string, string> = {
  5: "Ошибка авторизации VK: проверьте токен сообщества",
  6: "Превышено число запросов VK в секунду",
  7: "VK отказал в выполнении метода: проверьте права токена",
  9: "VK ограничил отправку сообщений (flood control)",
  10: "Внутренняя ошибка VK",
  15: "VK отказал в доступе",
  18: "Пользователь VK удалён или заблокирован",
  27: "Ошибка авторизации сообщества VK: проверьте его токен",
  29: "Достигнут лимит запросов VK",
  100: "VK отклонил параметры запроса",
  113: "VK отклонил ID получателя",
  125: "VK отклонил ID сообщества",
  900: "Отправка запрещена: получатель в чёрном списке",
  901: "Нет разрешения VK на отправку сообщений получателю",
  902: "Настройки приватности получателя запрещают сообщения",
  910: "Сообщение превышает допустимый размер VK",
  914: "Сообщение слишком длинное для VK",
  network: "Сетевой/HTTP-сбой VK: проверьте httpStatus и transportCode",
  response: "VK вернул ответ неожиданного формата",
  config:
    "Сообщения VK не настроены: проверьте наличие VK_GROUP_ID и VK_GROUP_TOKEN",
  recipient: "Некорректный ID получателя VK в сохранённой identity",
};

export const getVkMessagingErrorDiagnostics = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    /^P\d{4}$/.test(error.code)
  )
    return {
      code: error.code,
      reason:
        "Ошибка базы данных: проверьте доступность базы и применённые миграции",
    };
  if (!(error instanceof VkMessagingError))
    return { code: "unknown", reason: "Непредвиденная внутренняя ошибка" };
  return {
    code: error.code,
    reason: errorReasons[error.code] ?? "VK отклонил запрос: см. числовой code",
    method: error.details.method,
    httpStatus: error.details.httpStatus,
    transportCode: error.details.transportCode,
    requestDurationMs: error.details.durationMs,
  };
};

interface VkLogFields {
  orderId?: number;
  userId?: number;
  externalUserId?: string;
  peerId?: number;
  status?: string;
  transitionAt?: string;
  stage?: string;
  result?: string;
  reason?: string;
  code?: number | string;
  method?: string;
  httpStatus?: number;
  transportCode?: string;
  requestDurationMs?: number;
  durationMs?: number;
  vkMessagesEnabled?: boolean | null;
  requestedEnabled?: boolean;
  allowed?: boolean | null;
  randomId?: number;
  messageId?: number;
}

// Pass only explicitly selected scalar fields; no message texts, files, tokens or raw errors.
export const logVkMessaging = (
  level: "info" | "warn" | "error",
  event: string,
  fields: VkLogFields
) =>
  console[level](
    "[Capy Print][vk]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...getVkMessagingConfigDiagnostics(),
      ...fields,
    })
  );
