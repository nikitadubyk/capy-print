import { OrderStatusTitle } from "@/types";
import { OrderStatus } from "@/app/generated/prisma/enums";

export const titles = [
  "Дата",
  "Статус",
  "Копий",
  "Кол-во Файлов",
  "Срочность",
  "Комметарий",
];

export const adminTitles = [
  "ID",
  "Дата",
  "Ник",
  "Имя",
  "Статус",
  "Копий",
  "Кол-во Файлов",
  "Срочность",
  "Комметарий",
];

export const statusOptions = Object.values(OrderStatus).map((value) => ({
  value,
  label: OrderStatusTitle[value],
}));
