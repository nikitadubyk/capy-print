import { z } from "zod";
import {
  OrderStatus,
  PaperSize,
  UrgencyType,
} from "@/app/generated/prisma/enums";

const deadline = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Некорректная дата");
export const createOrderSchema = z
  .object({
    comment: z.string().max(5000).optional(),
    urgency: z.enum(UrgencyType),
    deadlineAt: deadline
      .or(z.literal("").transform(() => undefined))
      .optional(),
    printJobs: z
      .array(
        z.object({
          copies: z.number().int().min(1).max(1000).default(1),
          duplex: z.boolean().default(false),
          isColor: z.boolean().default(false),
          paperSize: z.enum(PaperSize).default(PaperSize.A4Basic),
          files: z
            .array(
              z.object({
                fileUrl: z.url(),
                fileName: z.string().min(1).max(1024),
                fileSize: z
                  .number()
                  .int()
                  .positive()
                  .max(16 * 1024 * 1024),
                mimeType: z.string().max(256).optional(),
              })
            )
            .min(1)
            .max(20),
        })
      )
      .min(1)
      .max(100),
  })
  .refine(
    (data) => data.urgency !== UrgencyType.SCHEDULED || !!data.deadlineAt,
    "Для запланированного заказа нужна дата"
  );

export const updateOrderSchema = z
  .object({
    status: z.enum(OrderStatus).optional(),
    comment: z.string().max(5000).nullable().optional(),
    urgency: z.enum(UrgencyType).optional(),
    deadlineAt: deadline.nullable().optional(),
  })
  .strict();

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(OrderStatus).optional(),
  urgency: z.enum(UrgencyType).optional(),
  scope: z.enum(["mine", "all"]).default("mine"),
});

export function orderId(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}
