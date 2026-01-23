import { OrderStatus } from "@/app/generated/prisma/enums";

import { Urgency, PaperSize } from "./enums";

export const OrderStatusTitle = {
  [OrderStatus.PENDING]: "Ожидание",
  [OrderStatus.CANCELLED]: "Отменен",
  [OrderStatus.PRINTING]: "Печатаем",
  [OrderStatus.COMPLETED]: "Выполнено",
  [OrderStatus.PROCESSING]: "В процессе",
};

export const UrgencyTitle = {
  [Urgency.ASAP]: "Как можно скорее",
  [Urgency.SCHEDULED]: "Выбрать дату и время",
};

export const UrgencyViewTitle = {
  [Urgency.ASAP]: "Срочно",
  [Urgency.SCHEDULED]: "К времени",
};

export const PaperSizeTitle: Record<string, string> = {
  [PaperSize.A4Basic]: "A4 простая бумага",
  [PaperSize.A4PhotoMatte]: "А4 (21×30) матовая",
  [PaperSize.A4PhotoGlossy]: "А4 (21×30) глянцевая",
  [PaperSize.A5PhotoMatte]: "А5 (14×21) матовая",
  [PaperSize.A5PhotoGlossy]: "А5 (14×21) глянцевая",
  [PaperSize.A6PhotoMatte]: "А6 (10×15) матовая",
  [PaperSize.A6PhotoGlossy]: "А6 (10×15) глянцевая",
};
