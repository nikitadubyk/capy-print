import { createHash } from "node:crypto";
import type { OrderStatus } from "@/app/generated/prisma/enums";
import { sendTelegramMessage } from "./telegram";
import { getLoyaltyProgressText } from "./order-discounts";
import {
  getVkMessagingErrorDiagnostics,
  logVkMessaging,
} from "./vk-diagnostics";
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
  platform: "telegram" | "vk",
  discountPercent = 0,
  completedOrdersCount?: number,
  cancellationReason?: string | null
) => {
  const title =
    platform === "telegram"
      ? (text: string) => `<b>${text}</b>`
      : (text: string) => text;
  const text =
    platform === "telegram"
      ? (value: string) =>
          value
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
      : (value: string) => value;
  switch (status) {
    case "CANCELLED":
      return `❌ ${title(`Ваш заказ #${id} отменен`)}${cancellationReason ? `\n\nПричина отмены:\n${text(cancellationReason)}` : "\n\n"}`;
    case "COMPLETED":
      return `✅ ${title(`Ваш заказ #${id} готов!`)}\n\nМожете забрать его по адресу: Изотова 7 (Центральный рынок).${discountPercent > 0 ? `\n\n🎁 К этому заказу будет применена скидка ${discountPercent}% от стоимости при оплате в копицентре.` : ""}${completedOrdersCount !== undefined ? `\n\n${getLoyaltyProgressText(completedOrdersCount)}` : ""}`;
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
  const startedAt = Date.now();
  const context = {
    orderId: order.id,
    userId: order.user.id,
    externalUserId: identity.externalUserId,
    status: order.status,
    transitionAt: order.updatedAt.toISOString(),
    vkMessagesEnabled: identity.vkMessagesEnabled ?? null,
  };
  logVkMessaging("info", "status.started", context);
  const message = formatCustomerStatusMessage(
    order.id,
    order.status,
    "vk",
    order.discountPercent,
    order.user.completedOrdersCount,
    order.cancellationReason
  );
  if (!message) {
    logVkMessaging("info", "status.skipped", {
      ...context,
      result: "skipped",
      reason: "Для этого статуса уведомление не предусмотрено",
    });
    return "skipped";
  }
  if (identity.vkMessagesEnabled !== true) {
    logVkMessaging("warn", "status.denied", {
      ...context,
      result: "denied",
      reason:
        identity.vkMessagesEnabled === false
          ? "Пользователь выключил уведомления в приложении"
          : "В приложении ещё не сохранено согласие на сообщения",
    });
    return "denied";
  }
  if (!getVkMessagingConfig()) {
    logVkMessaging("error", "status.unconfigured", {
      ...context,
      result: "unconfigured",
      ...getVkMessagingErrorDiagnostics(new VkMessagingError("config")),
    });
    return "unconfigured";
  }
  let stage = "permission_check";
  const randomId = vkNotificationRandomId(order);
  try {
    const allowed = await isVkMessagesAllowed(identity.externalUserId);
    logVkMessaging(allowed ? "info" : "warn", "status.permission_checked", {
      ...context,
      stage,
      allowed,
      ...(!allowed && {
        result: "denied",
        reason: "VK не разрешает сообщения от этого сообщества пользователю",
      }),
    });
    if (!allowed) return "denied";
    stage = "send_message";
    logVkMessaging("info", "status.sending", { ...context, stage, randomId });
    const messageId = await sendVkMessage(
      identity.externalUserId,
      message,
      randomId
    );
    logVkMessaging("info", "status.sent", {
      ...context,
      stage,
      randomId,
      messageId,
      result: "sent",
      durationMs: Date.now() - startedAt,
    });
    return "sent";
  } catch (error) {
    logVkMessaging("error", "status.failed", {
      ...context,
      stage,
      randomId,
      result: "failed",
      durationMs: Date.now() - startedAt,
      ...getVkMessagingErrorDiagnostics(error),
    });
    return "failed";
  }
};

const sendTelegramStatusNotification = async (
  order: StatusNotificationOrder
): Promise<NotificationResult> => {
  const message = formatCustomerStatusMessage(
    order.id,
    order.status,
    "telegram",
    order.discountPercent,
    order.user.completedOrdersCount,
    order.cancellationReason
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
  if (!vkIdentity)
    console.info(
      "[Capy Print][notifications]",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "status.routed",
        orderId: order.id,
        userId: order.user.id,
        status: order.status,
        platform,
        reason: "У владельца заказа нет VK identity; выбран Telegram",
      })
    );
  try {
    return vkIdentity
      ? await sendVkStatusNotification(order, vkIdentity)
      : await sendTelegramStatusNotification(order);
  } catch (error) {
    console.error("Ошибка уведомления о статусе заказа", {
      orderId: order.id,
      platform,
      ...getVkMessagingErrorDiagnostics(error),
    });
    return "failed";
  }
};
