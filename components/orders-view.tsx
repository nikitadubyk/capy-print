"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { Button, Skeleton, Text, Title } from "@mantine/core";
import { FolderOpen, Plus } from "lucide-react";
import { Routes } from "@/config/routes";
import type { ListResponse } from "@/store/api/orders/types";
import { OrderList } from "./order-list";
import { PageHeader } from "./page-header";
import { PageContainer } from "./page-container";
import { QueryError } from "./query-error";
import { SectionCard } from "./section-card";

interface OrdersViewProps {
  data?: ListResponse;
  isAdmin?: boolean;
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
}

const OrdersPending = () => (
  <div className="space-y-4" role="status" aria-label="Загрузка заказов">
    <Text c="dimmed">Загружаем заказы…</Text>
    {[1, 2, 3].map((item) => (
      <Skeleton key={item} height={280} radius="xl" />
    ))}
  </div>
);

const OrdersError = ({ refetch }: Pick<OrdersViewProps, "refetch">) => (
  <QueryError title="Не удалось загрузить заказы" refetch={refetch} />
);

const OrdersEmpty = ({ isAdmin }: Pick<OrdersViewProps, "isAdmin">) => (
  <SectionCard className="p-6 text-center md:p-10">
    <FolderOpen
      size={36}
      className="mx-auto mb-4 text-capy-accent"
      aria-hidden="true"
    />
    <Title order={3}>
      {isAdmin ? "Заказов пока нет" : "Здесь будут ваши заказы"}
    </Title>
    <Text c="dimmed" className="mt-2">
      {isAdmin
        ? "Новые заказы клиентов появятся в этом списке."
        : "Загрузите файлы для печати — заказ появится в этом списке."}
    </Text>
    {!isAdmin && (
      <Button
        component={Link}
        href={Routes.Order}
        size="md"
        leftSection={<Plus size={18} />}
        className="mt-5"
      >
        Новый заказ
      </Button>
    )}
  </SectionCard>
);

const OrdersResult = ({
  data,
  isAdmin,
  page,
  setPage,
}: Pick<OrdersViewProps, "data" | "isAdmin" | "page" | "setPage">) => (
  <OrderList data={data} isAdmin={isAdmin} page={page} setPage={setPage} />
);

const OrdersContent = (props: OrdersViewProps) => {
  if (props.isPending) return <OrdersPending />;
  if (props.isError) return <OrdersError refetch={props.refetch} />;
  if (props.data && (props.data.orders.length > 0 || props.data.total > 0))
    return <OrdersResult {...props} />;
  return <OrdersEmpty isAdmin={props.isAdmin} />;
};

export const OrdersView = (props: OrdersViewProps) => (
  <PageContainer>
    <PageHeader
      title={props.isAdmin ? "Все заказы" : "Мои заказы"}
      backUrl={Routes.Home}
      description={
        props.isAdmin
          ? "Заказы клиентов и управление статусами печати."
          : "Следите за готовностью и открывайте детали своих заказов."
      }
    />
    <OrdersContent {...props} />
  </PageContainer>
);
