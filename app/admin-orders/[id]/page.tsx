"use client";

import { useParams } from "next/navigation";
import { Routes } from "@/config/routes";
import { useDetailsQuery } from "@/store/api/orders/hooks";
import { OrderDetailsView } from "@/components/order-details-view";
import { useMiniApp } from "@/context";

const AdminOrder = () => {
  const { id } = useParams<{ id: string }>();
  const query = useDetailsQuery(id);
  const { user } = useMiniApp();
  return (
    <OrderDetailsView
      {...query}
      id={id}
      isAdmin={user?.role === "ADMIN"}
      backUrl={Routes.AdminOrders}
    />
  );
};

export default AdminOrder;
