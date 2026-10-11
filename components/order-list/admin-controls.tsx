"use client";

import { useState } from "react";
import { Alert, Button, Loader, Modal, Select, Text } from "@mantine/core";
import { Trash2 } from "lucide-react";

import { OrderStatus } from "@/app/generated/prisma/enums";
import { useDeleteOrder, useUpdateStatus } from "@/store/api/orders/hooks";
import { statusOptions } from "./config";
import { CancelOrderDialog } from "./cancel-order-dialog";

export const AdminOrderControls = ({
  id,
  status,
}: {
  id: number;
  status: OrderStatus;
}) => {
  const updateStatus = useUpdateStatus();
  const deleteOrder = useDeleteOrder();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [cancelOpened, setCancelOpened] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const busy = updateStatus.isPending || deleteOrder.isPending;

  const handleStatusChange = (value: string | null) => {
    if (!value || value === status || busy) return;
    setError(null);
    const nextStatus = value as OrderStatus;
    if (nextStatus === "CANCELLED") {
      setCancelError(null);
      setCancelOpened(true);
      return;
    }
    updateStatus.mutate(
      { id: String(id), status: nextStatus },
      {
        onError: () =>
          setError("Не удалось изменить статус. Попробуйте ещё раз."),
      }
    );
  };

  const handleCancel = async (cancellationReason: string) => {
    if (busy) return;
    setCancelError(null);
    try {
      await updateStatus.mutateAsync({
        id: String(id),
        status: "CANCELLED",
        cancellationReason,
      });
      setCancelOpened(false);
    } catch {
      setCancelError("Не удалось отменить заказ. Попробуйте ещё раз.");
    }
  };

  const handleDelete = () => {
    if (busy) return;
    setError(null);
    deleteOrder.mutate(String(id), {
      onSuccess: () => setDeleteOpened(false),
      onError: () => setError("Не удалось удалить заказ. Попробуйте ещё раз."),
    });
  };

  return (
    <div className="mt-5 border-t border-capy-line pt-5">
      <Select
        label="Статус заказа"
        aria-label={`Статус заказа #${id}`}
        value={status}
        data={statusOptions}
        disabled={busy || status === "COMPLETED"}
        onChange={handleStatusChange}
        rightSection={updateStatus.isPending ? <Loader size={20} /> : undefined}
        comboboxProps={{ dropdownPadding: 6 }}
      />
      {status === "COMPLETED" && (
        <Text size="sm" c="dimmed" className="mt-2">
          Статус «Выполнено» окончательный.
        </Text>
      )}
      {error && !deleteOpened && (
        <Alert color="red" className="mt-3" role="alert">
          {error}
        </Alert>
      )}
      <Button
        variant="subtle"
        fullWidth
        size="md"
        leftSection={<Trash2 size={18} aria-hidden="true" />}
        onClick={() => {
          setError(null);
          setDeleteOpened(true);
        }}
        disabled={busy}
        loading={deleteOrder.isPending}
        className="mt-3"
        aria-label={`Удалить заказ #${id}`}
      >
        Удалить заказ
      </Button>
      <Modal
        opened={deleteOpened}
        onClose={() => !busy && setDeleteOpened(false)}
        title={`Удалить заказ #${id}?`}
        closeOnClickOutside={!busy}
        closeOnEscape={!busy}
        withCloseButton={!busy}
        closeButtonProps={{ "aria-label": "Отменить удаление" }}
      >
        <Text>
          Вы уверены, что хотите удалить этот заказ? Это действие нельзя
          отменить.
        </Text>
        {error && (
          <Alert color="red" className="mt-4" role="alert">
            {error}
          </Alert>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="light"
            size="md"
            disabled={busy}
            onClick={() => setDeleteOpened(false)}
          >
            Отмена
          </Button>
          <Button
            size="md"
            onClick={handleDelete}
            loading={deleteOrder.isPending}
            disabled={updateStatus.isPending}
          >
            Удалить
          </Button>
        </div>
      </Modal>
      {cancelOpened && (
        <CancelOrderDialog
          id={id}
          busy={busy}
          error={cancelError}
          onClose={() => setCancelOpened(false)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
};
