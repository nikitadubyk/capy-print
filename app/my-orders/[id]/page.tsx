"use client";

import { useParams } from "next/navigation";
import { LoadingOverlay } from "@mantine/core";

import { Routes } from "@/config";
import { useDetailsQuery } from "@/api/orders/hooks";
import { BackButton, OrderDetails } from "@/components";

export default function MyOrder() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useDetailsQuery(id);

  console.log("id in page", { id, data });

  if (isLoading) {
    return <LoadingOverlay visible={isLoading} />;
  }

  if (!data) {
    return (
      <div className="p-4">
        <BackButton url={Routes.MyOrders} />
        <p className="mt-4 text-gray-500">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div>
        <BackButton url={Routes.MyOrders} />
      </div>

      <OrderDetails data={data} id={id} />
    </div>
  );
}
