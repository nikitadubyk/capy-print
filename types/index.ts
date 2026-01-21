import { DefaultMantineColor } from "@mantine/core";

import { UserRole } from "@/lib";
import { OrderStatus } from "@/app/generated/prisma/enums";

import { Urgency } from "./enums";

export * from "./enums";
export * from "./titles";

export interface UserDTO {
  id: number;
  role?: UserRole;
  username: string;
  lastName: string;
  firstName: string;
  telegramId: number;
}

export interface OrderFile {
  id: number;
  fileUrl: string;
  fileSize: number;
  fileName: string;
  mimeType?: string;
}

export interface PrintJob {
  id: number;
  copies: number;
  duplex: boolean;
  isColor: boolean;
  files: OrderFile[];
  paperSize: string | null;
}

export interface Order {
  id: number;
  user: UserDTO;
  createdAt: Date;
  comment?: string;
  urgency: Urgency;
  status: OrderStatus;
  deadlineAt?: string;
  printJobs: PrintJob[];
}

export const OrderStatusColor: Record<OrderStatus, DefaultMantineColor> = {
  [OrderStatus.PENDING]: "blue",
  [OrderStatus.CANCELLED]: "red",
  [OrderStatus.COMPLETED]: "green",
  [OrderStatus.PRINTING]: "yellow",
  [OrderStatus.PROCESSING]: "yellow",
};
