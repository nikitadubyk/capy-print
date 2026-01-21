"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingOverlay, Title } from "@mantine/core";

import { Routes } from "@/config";
import { useTelegram } from "@/context";
import { useListQuery } from "@/api/orders/hooks";
import { OrderList, BackButton } from "@/components";

import { UserRole } from "../generated/prisma/enums";

export default function AdminOrders() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { role, loading } = useTelegram();

  const isAdmin = role === UserRole.ADMIN;

  const { data, isPending } = useListQuery({ page });

  useEffect(() => {
    if (!loading && !isAdmin && role) {
      router.push(Routes.Home);
    }
  }, [loading, isAdmin, router, role]);

  if (loading || isPending) {
    return <LoadingOverlay visible={loading || isPending} />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-4">
      <div>
        <BackButton url={Routes.Home} />
      </div>
      <Title order={2}>Все заказы</Title>
      <OrderList isAdmin data={data} page={page} setPage={setPage} />
    </div>
  );
}
