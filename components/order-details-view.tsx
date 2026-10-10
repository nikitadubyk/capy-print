import { Skeleton, Text } from "@mantine/core";
import { isAxiosError } from "axios";
import type { Order } from "@/types";
import { PageHeader } from "./page-header";
import { OrderDetails } from "./order-details";
import { PageContainer } from "./page-container";
import { QueryError } from "./query-error";

interface OrderDetailsViewProps {
  id: string;
  backUrl: string;
  data?: Order;
  isAdmin?: boolean;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
}

export const OrderDetailsView = ({
  id,
  backUrl,
  data,
  isAdmin = false,
  isPending,
  isError,
  error,
  refetch,
}: OrderDetailsViewProps) => (
  <PageContainer>
    <PageHeader title={`Заказ #${id}`} backUrl={backUrl} />
    {isPending ? (
      <div role="status" aria-label="Загрузка заказа" className="space-y-4">
        <Text c="dimmed">Загружаем заказ…</Text>
        <Skeleton height={240} radius="xl" />
        <Skeleton height={280} radius="xl" />
      </div>
    ) : isAxiosError(error) && error.response?.status === 404 ? (
      <Text c="dimmed">Заказ не найден. Возможно, он был удалён.</Text>
    ) : isError ? (
      <QueryError title="Не удалось загрузить заказ" refetch={refetch} />
    ) : data ? (
      <OrderDetails data={data} isAdmin={isAdmin} />
    ) : (
      <Text c="dimmed">Заказ не найден.</Text>
    )}
  </PageContainer>
);
