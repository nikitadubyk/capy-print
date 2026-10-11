import { z } from "zod";
import { CANCELLATION_REASON_MAX_LENGTH } from "@/config/order-cancellation";

export const cancelOrderDialogSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(1, "Укажите причину отмены")
    .max(
      CANCELLATION_REASON_MAX_LENGTH,
      `Причина отмены должна содержать не больше ${CANCELLATION_REASON_MAX_LENGTH} символов`
    ),
});

export type CancelOrderDialogValues = z.infer<typeof cancelOrderDialogSchema>;
