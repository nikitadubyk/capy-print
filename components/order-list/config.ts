import { OrderStatusTitle } from "@/types";
import { OrderStatus } from "@/app/generated/prisma/enums";

export const statusOptions = Object.values(OrderStatus).map((value) => ({
  value,
  label: OrderStatusTitle[value],
}));
