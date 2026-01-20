import { User } from "@tma.js/sdk-react";

import { Urgency } from "./enums";
import { OrderStatus } from "@/app/generated/prisma/enums";

export * from "./enums";

export interface OrderFile {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
}

export interface PrintJob {
  copies: number;
  duplex: boolean;
  isColor: boolean;
  files: OrderFile[];
  paperSize: string | null;
}

export interface Order {
  id: number;
  createdAt: Date;
  comment?: string;
  urgency: Urgency;
  status: OrderStatus;
  deadlineAt?: string;
  user: Partial<User>;
  printJobs: PrintJob[];
}
