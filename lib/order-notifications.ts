import { createHash } from "node:crypto";
import dayjs from "dayjs";
import { Urgency, PaperSizeTitle, type Order } from "@/types";
import { getVkAdminPeerIds } from "@/config/vk-server";
import { getCustomerContact } from "./customer";
import { sendTelegramMessage } from "./telegram";
import {
  getVkMessagingConfig,
  sendVkPeerMessage,
  VkMessagingError,
} from "./vk";
import type { NotificationResult, StaffNotificationResult } from "./types";

const format = "DD.MM.YYYY HH:mm";
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// One template supplies the same order details to both transports.
export const formatOrderNotification = (
  order: Order,
  platform: "telegram" | "vk" = "telegram"
): string => {
  const customer = getCustomerContact(order.user);
  const text = platform === "telegram" ? escapeHtml : (value: string) => value;
  const bold = (value: string) =>
    platform === "telegram" ? `<b>${text(value)}</b>` : value;
  const link = (label: string, url: string) =>
    platform === "telegram"
      ? `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`
      : `${label}: ${url}`;
  const urgencyText =
    order.urgency === Urgency.ASAP ? "🔴 СРОЧНО" : "📅 Запланирован";

  let message = `
    ${bold(`Новый заказ #${order.id}`)}

    ${urgencyText}
    👤 Клиент: ${text(customer.name)}
    📱 Платформа: ${customer.platform}
    🆔 ID клиента: ${order.user.id}${customer.externalId ? ` · ${customer.platform} ID: ${text(String(customer.externalId))}` : ""}
    ${customer.profileUrl ? `🔗 ${link("Открыть профиль", customer.profileUrl)}` : ""}
    ${customer.messageUrl ? `✉️ ${link("Написать клиенту", customer.messageUrl)}` : ""}

    📋 ${bold("Детали заказа:")}
  `;
  order.printJobs.forEach((job, index) => {
    message += `
      ${bold(`Набор ${index + 1}:`)}
      - Копий: ${job.copies}
      - Цветная: ${job.isColor ? "Да" : "Нет"}
      - Размер: ${PaperSizeTitle[job.paperSize || ""]}
      - Двухсторонняя печать: ${job.duplex ? "Да" : "Нет"}
      - Файлов: ${job.files.length}
      📎 ${bold("Файлы:")}
        ${job.files.map((file, i) => `${i + 1}. ${link(file.fileName, file.fileUrl)}`).join("\n")}
    `;
  });
  if (order.comment) message += `\n💬 Комментарий: ${text(order.comment)}`;
  if (order.deadlineAt)
    message += `\n⏰ Дедлайн: ${dayjs(order.deadlineAt).format(format)}`;
  message += `\n\n📅 Создан: ${dayjs(order.createdAt).format(format)}`;
  return message;
};

// Separate event namespace and recipient: retries of this new order keep their VK ID.
export const vkStaffNotificationRandomId = (
  order: Pick<Order, "id" | "createdAt">,
  peerId: number
) =>
  createHash("sha256")
    .update(
      `staff-order:${order.id}:${dayjs(order.createdAt).toISOString()}:${peerId}`
    )
    .digest()
    .readUInt32BE(0) & 0x7fffffff || 1;

const sendTelegramOrderNotification = async (
  order: Order,
  chatId: string | number | undefined
): Promise<NotificationResult> => {
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    console.error("Не настроено уведомление сотрудникам Telegram", {
      orderId: order.id,
      code: "config",
    });
    return "unconfigured";
  }
  return (await sendTelegramMessage({
    chatId,
    text: formatOrderNotification(order),
  }))
    ? "sent"
    : "failed";
};

const sendVkOrderNotification = async (
  order: Order,
  peerId: number,
  message: string
): Promise<NotificationResult> => {
  try {
    if (!getVkMessagingConfig()) throw new VkMessagingError("config");
    // Staff destinations are a server-owned allowlist, independent of the customer's preference.
    // VK still enforces permission to receive community messages for the destination.
    await sendVkPeerMessage(
      peerId,
      message,
      vkStaffNotificationRandomId(order, peerId)
    );
    return "sent";
  } catch (error) {
    const code = error instanceof VkMessagingError ? error.code : "unknown";
    console.error("Ошибка уведомления сотрудникам VK", {
      orderId: order.id,
      peerId,
      code,
    });
    return code === "config" ? "unconfigured" : "failed";
  }
};

export const sendOrderNotification = async (
  order: Order,
  chatId: string | number | undefined = process.env.ADMIN_GROUP_CHAT_ID?.trim()
): Promise<StaffNotificationResult> => {
  const peers = getVkAdminPeerIds();
  if (peers === null)
    console.error("Некорректные получатели уведомления VK", {
      orderId: order.id,
      code: "config",
      field: "VK_ADMIN_PEER_IDS",
    });
  const message = formatOrderNotification(order, "vk");
  // Start all channels together; a Telegram timeout or one failed VK peer cannot block the others.
  const [telegram, vk] = await Promise.all([
    sendTelegramOrderNotification(order, chatId),
    Promise.all(
      (peers ?? []).map(async (peerId) => ({
        peerId,
        result: await sendVkOrderNotification(order, peerId, message),
      }))
    ),
  ]);
  return { telegram, vk };
};
