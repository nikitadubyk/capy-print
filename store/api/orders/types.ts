import { Order } from "@/types";
import type { OrderStatus } from "@/app/generated/prisma/enums";

export type UpdateOrderStatusRequest =
  | { status: "CANCELLED"; cancellationReason: string }
  | { status: Exclude<OrderStatus, "CANCELLED">; cancellationReason?: never };

export interface ListRequest {
  page: number;
  limit?: number;
  status?: string;
  urgency?: string;
  scope?: "mine" | "all";
}

export interface ListResponse {
  page: number;
  limit: number;
  total: number;
  orders: Order[];
  totalPages: number;
}
