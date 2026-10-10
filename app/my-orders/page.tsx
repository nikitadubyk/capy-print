"use client";

import { useState } from "react";
import { useListQuery } from "@/store/api/orders/hooks";
import { OrdersView } from "@/components/orders-view";

const MyOrders = () => {
  const [page, setPage] = useState(1);
  const query = useListQuery({ page, scope: "mine" });
  return <OrdersView {...query} page={page} setPage={setPage} />;
};

export default MyOrders;
