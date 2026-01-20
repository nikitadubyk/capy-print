import { Order } from "@/types";

export interface ListRequest {
  page: number;
  limit?: number;
  status?: string;
  urgency?: string;
  telegramId?: string;
}

export interface ListResponse {
  page: number;
  limit: number;
  total: number;
  orders: Order[];
  totalPages: number;
}
