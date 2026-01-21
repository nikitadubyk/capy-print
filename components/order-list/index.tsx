import dayjs from "dayjs";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { Table, Pagination, Select, Button } from "@mantine/core";

import { Routes } from "@/config";
import { ListResponse } from "@/api/orders/types";
import { Urgency, UrgencyViewTitle } from "@/types";
import { OrderStatus } from "@/app/generated/prisma/enums";
import { useDeleteOrder, useUpdateStatus } from "@/api/orders/hooks";

import { OrderStatusBadge } from "../order-status-badge";

import { adminTitles, titles, statusOptions } from "./config";

interface OrderListProps {
  page: number;
  isAdmin?: boolean;
  data?: ListResponse;
  setPage: Dispatch<SetStateAction<number>>;
}

export const OrderList = ({ data, page, isAdmin, setPage }: OrderListProps) => {
  const router = useRouter();
  const deleteOrder = useDeleteOrder();
  const updateStatus = useUpdateStatus();

  const currentTitles = isAdmin ? adminTitles : titles;
  const detailsRoute = isAdmin ? Routes.AdminOrderDetail : Routes.MyOrderDetail;

  const handleStatusChange = (orderId: number, status: string | null) => {
    if (status) {
      updateStatus.mutate({
        id: String(orderId),
        status: status as OrderStatus,
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите удалить этот заказ?")) {
      deleteOrder.mutate(String(id));
    }
  };

  const rows = data?.orders?.map((value) => {
    const { filesCount, copiesCount } = value?.printJobs?.reduce(
      (acc, job) => {
        acc.copiesCount += job.copies || 0;
        acc.filesCount += job.files?.length || 0;
        return acc;
      },
      { filesCount: 0, copiesCount: 0 },
    );

    return (
      <Table.Tr
        key={value.id}
        onClick={() =>
          router.push(detailsRoute.replace(":id", String(value.id)))
        }
      >
        {isAdmin && <Table.Td>{value.id}</Table.Td>}
        <Table.Td>{dayjs(value.createdAt).format("DD.MM.YYYY HH:mm")}</Table.Td>
        {isAdmin && (
          <>
            <Table.Td>{value.user?.username}</Table.Td>
            <Table.Td>{`${value.user?.firstName || ""} ${value.user?.lastName || ""}`}</Table.Td>
          </>
        )}
        <Table.Td miw={150}>
          {isAdmin ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                size="xs"
                value={value.status}
                data={statusOptions}
                onChange={(status) => handleStatusChange(value.id, status)}
              />
            </div>
          ) : (
            <OrderStatusBadge status={value.status} />
          )}
        </Table.Td>
        <Table.Td>{copiesCount}</Table.Td>
        <Table.Td miw={128}>{filesCount}</Table.Td>
        <Table.Td miw={128}>
          {UrgencyViewTitle[value.urgency]}
          {value.urgency === Urgency.SCHEDULED && ` - ${value.deadlineAt}`}
        </Table.Td>
        <Table.Td miw={128}>{value?.comment || "-"}</Table.Td>
        {isAdmin && (
          <Table.Td miw={128}>
            <Button
              color="red"
              variant="filled"
              aria-label="Удалить"
              disabled={deleteOrder.isPending}
              leftSection={<Trash size={18} />}
              onClick={(e) => handleDelete(e, value.id)}
            >
              Удалить
            </Button>
          </Table.Td>
        )}
      </Table.Tr>
    );
  });

  return (
    <>
      <Table stickyHeader>
        <Table.Thead>
          <Table.Tr>
            {currentTitles?.map((title, index) => (
              <Table.Th key={index}>{title}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Pagination
        value={page}
        className="mt-2"
        onChange={setPage}
        total={data?.totalPages || 1}
      />
    </>
  );
};
