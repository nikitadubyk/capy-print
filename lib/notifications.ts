import { createHash } from "node:crypto";
import type { OrderStatus } from "@/app/generated/prisma/enums";
import { sendTelegramMessage } from "./telegram";
import {
  getVkMessagingConfig,
  isVkMessagesAllowed,
  sendVkMessage,
  VkMessagingError,
} from "./vk";

import type {
  NotificationResult,
  StatusNotificationIdentity,
  StatusNotificationOrder,
} from "./types";

export const formatCustomerStatusMessage = (
  id: number,
  status: OrderStatus,
  platform: "telegram" | "vk"
) => {
  const title =
    platform === "telegram"
      ? (text: string) => `<b>${text}</b>`
      : (text: string) => text;
  switch (status) {
    case "CANCELLED":
      return `❌ ${title(`Ваш заказ #${id} отменен`)}\n\n`;
    case "COMPLETED":
      return `✅ ${title(`Ваш заказ #${id} готов!`)}\n\nМожете забрать его по адресу: Изотова 7 (Центральный рынок).`;
    case "PRINTING":
      return `🖨️ ${title(`Ваш заказ #${id} принят в работу!`)}\n\nМы начали печатать ваши документы. Как только заказ будет готов, вы получите уведомление.`;
    default:
      return null;
  }
};

// Stable for a saved transition; returning to a status later produces a new event.
export const vkNotificationRandomId = (
  order: Pick<StatusNotificationOrder, "id" | "status" | "updatedAt">
) =>
  createHash("sha256")
    .update(
      `order:${order.id}:${order.status}:${order.updatedAt.toISOString()}`
    )
    .digest()
    .readUInt32BE(0) & 0x7fffffff || 1;

const sendVkStatusNotification = async (
  order: StatusNotificationOrder,
  identity: StatusNotificationIdentity
): Promise<NotificationResult> => {
  const message = formatCustomerStatusMessage(order.id, order.status, "vk");
  if (!message) return "skipped";
  if (identity.vkMessagesEnabled !== true) return "denied";
  if (!getVkMessagingConfig()) return "unconfigured";
  if (!(await isVkMessagesAllowed(identity.externalUserId))) return "denied";
  await sendVkMessage(
    identity.externalUserId,
    message,
    vkNotificationRandomId(order)
  );
  return "sent";
};

const sendTelegramStatusNotification = async (
  order: StatusNotificationOrder
): Promise<NotificationResult> => {
  const message = formatCustomerStatusMessage(
    order.id,
    order.status,
    "telegram"
  );
  if (!message) return "skipped";
  const telegramId =
    order.user.identities?.find((identity) => identity.provider === "TELEGRAM")
      ?.externalUserId ?? order.user.telegramId;
  if (!telegramId) return "skipped";
  return (await sendTelegramMessage({
    text: message,
    chatId: String(telegramId),
  }))
    ? "sent"
    : "failed";
};

export const sendCustomerStatusNotification = async (
  order: StatusNotificationOrder
): Promise<NotificationResult> => {
  const vkIdentity = order.user.identities?.find(
    (identity) => identity.provider === "VK"
  );
  const platform = vkIdentity ? "vk" : "telegram";
  try {
    return vkIdentity
      ? await sendVkStatusNotification(order, vkIdentity)
      : await sendTelegramStatusNotification(order);
  } catch (error) {
    console.error("Ошибка уведомления о статусе заказа", {
      orderId: order.id,
      platform,
      code: error instanceof VkMessagingError ? error.code : "unknown",
    });
    return "failed";
  }
};
