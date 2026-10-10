"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Pagination, Text } from "@mantine/core";
import type { ListResponse } from "@/store/api/orders/types";

import { OrderCard } from "./order-card";
import { AdminOrderControls } from "./admin-controls";

interface OrderListProps {
  page: number;
  isAdmin?: boolean;
  data?: ListResponse;
  setPage: Dispatch<SetStateAction<number>>;
}

export const OrderList = ({
  data,
  page,
  isAdmin = false,
  setPage,
}: OrderListProps) => {
  const totalPages = Math.max(1, data?.totalPages || 1);
  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages, setPage]);

  return (
    <>
      <div
        className="flex flex-col gap-4"
        aria-label={isAdmin ? "Заказы клиентов" : "Список моих заказов"}
      >
        {data?.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isAdmin={isAdmin}
            controls={
              isAdmin && (
                <AdminOrderControls id={order.id} status={order.status} />
              )
            }
          />
        ))}
      </div>
      <nav
        className="mt-8 flex flex-col items-center gap-3 border-t border-capy-line pt-6"
        aria-label="Страницы заказов"
      >
        <Text size="sm" c="dimmed" aria-live="polite">
          Страница {page} из {totalPages}
        </Text>
        <Pagination
          value={page}
          onChange={(value) => {
            setPage(value);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
          total={totalPages}
          size="lg"
          siblings={0}
          boundaries={0}
          classNames={{ control: "min-h-11 min-w-11" }}
          getItemProps={(value) => ({ "aria-label": `Страница ${value}` })}
          getControlProps={(control) => ({
            "aria-label":
              control === "next" ? "Следующая страница" : "Предыдущая страница",
          })}
        />
      </nav>
    </>
  );
};
