"use client";

import { Button, Modal, Textarea } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CANCELLATION_REASON_MAX_LENGTH } from "@/config/order-cancellation";
import {
  cancelOrderDialogSchema,
  type CancelOrderDialogValues,
} from "./cancel-order-dialog-schema";

interface CancelOrderDialogProps {
  id: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const CancelOrderDialog = ({
  id,
  busy,
  error,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) => {
  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<CancelOrderDialogValues>({
    resolver: zodResolver(cancelOrderDialogSchema),
    defaultValues: { cancellationReason: "" },
    mode: "onChange",
  });
  const submitting = busy || isSubmitting;
  const submit = handleSubmit(async ({ cancellationReason }) => {
    if (busy) return;
    await onConfirm(cancellationReason);
  });

  return (
    <Modal
      opened
      onClose={() => !submitting && onClose()}
      title={`Вы точно хотите отменить заказ #${id}?`}
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      withCloseButton={!submitting}
      closeButtonProps={{ "aria-label": "Закрыть отмену заказа" }}
    >
      <form onSubmit={submit} noValidate>
        <Controller
          name="cancellationReason"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              {...field}
              label="Причина отмены"
              description="Клиент увидит причину в сообщении и деталях заказа."
              placeholder="Например, файл не открывается"
              required
              data-autofocus
              maxLength={CANCELLATION_REASON_MAX_LENGTH}
              minRows={3}
              maxRows={6}
              autosize
              size="md"
              disabled={submitting}
              error={fieldState.error?.message || error}
            />
          )}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="light"
            size="md"
            disabled={submitting}
            onClick={onClose}
            className="flex-1"
          >
            Закрыть
          </Button>
          <Button
            type="submit"
            color="red"
            size="md"
            loading={submitting}
            disabled={!isValid || submitting}
            className="flex-1"
          >
            Отменить заказ
          </Button>
        </div>
      </form>
    </Modal>
  );
};
