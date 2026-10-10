import type { ReactNode } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { Button, Divider, Text, Title } from "@mantine/core";
import { ArrowRight, Clock, Copy, Files, UserRound } from "lucide-react";

import { Routes } from "@/config/routes";
import { getCustomerContact } from "@/lib/customer";
import { type Order, Urgency, UrgencyViewTitle } from "@/types";
import { OrderStatusBadge } from "../order-status-badge";
import { SectionCard } from "../section-card";

interface OrderCardProps {
  order: Order;
  isAdmin?: boolean;
  controls?: ReactNode;
}

export const OrderCard = ({
  order,
  isAdmin = false,
  controls,
}: OrderCardProps) => {
  const customer = getCustomerContact(order.user);
  const counts = order.printJobs.reduce(
    (total, job) => ({
      copies: total.copies + job.copies,
      files: total.files + job.files.length,
    }),
    { copies: 0, files: 0 }
  );
  const detailsRoute = isAdmin ? Routes.AdminOrderDetail : Routes.MyOrderDetail;
  const createdAt = dayjs(order.createdAt);
  const deadline = order.deadlineAt ? dayjs(order.deadlineAt) : null;
  const deadlineLabel = deadline?.isValid()
    ? deadline.format("DD.MM.YYYY · HH:mm")
    : order.deadlineAt;

  return (
    <SectionCard
      component="article"
      className="min-w-0"
      aria-labelledby={`order-${order.id}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Title id={`order-${order.id}`} order={3}>
            Заказ #{order.id}
          </Title>
          <Text size="sm" c="dimmed" className="mt-1">
            <time dateTime={createdAt.toISOString()}>
              {createdAt.format("DD.MM.YYYY · HH:mm")}
            </time>
          </Text>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      {isAdmin && (
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-capy-blue/40 p-3">
          <UserRound
            size={20}
            className="mt-1 shrink-0 text-capy-accent"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <Text fw={600} className="wrap-anywhere">
              {customer.name}
            </Text>
            <Text size="sm" c="dimmed" className="wrap-anywhere">
              {customer.platform}
              {order.user.username && ` · @${order.user.username}`}
            </Text>
          </div>
        </div>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <Copy
            size={20}
            className="mt-1 shrink-0 text-capy-accent"
            aria-hidden="true"
          />
          <div>
            <Text component="dt" size="sm" c="dimmed">
              Копий
            </Text>
            <Text component="dd" fw={600}>
              {counts.copies}
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Files
            size={20}
            className="mt-1 shrink-0 text-capy-accent"
            aria-hidden="true"
          />
          <div>
            <Text component="dt" size="sm" c="dimmed">
              Файлов
            </Text>
            <Text component="dd" fw={600}>
              {counts.files}
            </Text>
          </div>
        </div>
      </dl>
      <Divider className="my-5" />
      <div className="flex items-start gap-2">
        <Clock
          size={20}
          className="mt-1 shrink-0 text-capy-muted"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <Text size="sm" c="dimmed">
            Срочность
          </Text>
          <Text fw={500}>{UrgencyViewTitle[order.urgency]}</Text>
          {order.urgency === Urgency.SCHEDULED && order.deadlineAt && (
            <Text className="wrap-anywhere">{deadlineLabel}</Text>
          )}
        </div>
      </div>
      {order.comment && (
        <div className="mt-4">
          <Text size="sm" c="dimmed">
            Комментарий
          </Text>
          <Text className="whitespace-pre-wrap wrap-anywhere">
            {order.comment}
          </Text>
        </div>
      )}
      {controls}
      <Button
        component={Link}
        href={detailsRoute.replace(":id", String(order.id))}
        fullWidth
        variant={isAdmin ? "light" : "filled"}
        size="md"
        rightSection={<ArrowRight size={18} aria-hidden="true" />}
        className="mt-5"
        aria-label={`Открыть заказ #${order.id}`}
      >
        Подробнее о заказе
      </Button>
    </SectionCard>
  );
};
