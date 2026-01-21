"use client";

import { useState } from "react";
import { LoadingOverlay, Title } from "@mantine/core";

import { Routes } from "@/config";
import { useTelegram } from "@/context";
import { useListQuery } from "@/api/orders/hooks";
import { BackButton, OrderList } from "@/components";

export default function MyOrders() {
  const { user } = useTelegram();
  const [page, setPage] = useState(1);

  const { data, isPending } = useListQuery({
    page,
    telegramId: String(user?.id),
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
      <OrderList data={data} page={page} setPage={setPage} />
    </div>
  );
}
