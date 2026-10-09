"use client";

import { useState } from "react";
import { Alert, Button, LoadingOverlay, Title } from "@mantine/core";

import { Routes } from "@/config";
import { useListQuery } from "@/store/api/orders/hooks";
import { BackButton, OrderList } from "@/components";

export default function MyOrders() {
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useListQuery({
    page,
    scope: "mine",
  });

  if (isPending) {
    return <LoadingOverlay visible={isPending} />;
  }

  return (
    <div className="p-4">
      <div>
        <BackButton url={Routes.Home} />
      </div>
      <Title order={2}>Мои заказы</Title>
      {isError ? (
        <Alert color="red" title="Не удалось загрузить заказы" mt="md">
          Проверьте интернет и попробуйте ещё раз.
          <Button mt="sm" onClick={() => void refetch()}>
            Повторить
          </Button>
        </Alert>
      ) : data?.orders.length ? (
        <OrderList data={data} page={page} setPage={setPage} />
      ) : (
        <p className="mt-4 text-gray-500">У вас пока нет заказов.</p>
      )}
    </div>
  );
}
