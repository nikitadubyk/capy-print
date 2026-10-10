"use client";

import { useParams } from "next/navigation";
import { Routes } from "@/config/routes";
import { useDetailsQuery } from "@/store/api/orders/hooks";
import { OrderDetailsView } from "@/components/order-details-view";

const MyOrder = () => {
  const { id } = useParams<{ id: string }>();
  const query = useDetailsQuery(id);
  return <OrderDetailsView {...query} id={id} backUrl={Routes.MyOrders} />;
};

export default MyOrder;
