"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Routes } from "@/config/routes";
import { useMiniApp } from "@/context";
import { useListQuery } from "@/store/api/orders/hooks";
import { OrdersView } from "@/components/orders-view";
import { UserRole } from "../generated/prisma/enums";

const AdminOrders = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { user, loading } = useMiniApp();
  const role = user?.role;
  const isAdmin = role === UserRole.ADMIN;
  const query = useListQuery({ page, scope: "all" });

  useEffect(() => {
    if (!loading && !isAdmin && role) router.push(Routes.Home);
  }, [loading, isAdmin, router, role]);

  if (!loading && !isAdmin) return null;
  return (
    <OrdersView
      {...query}
      isAdmin
      isPending={loading || query.isPending}
      page={page}
      setPage={setPage}
    />
  );
};

export default AdminOrders;
