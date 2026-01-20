"use client";

import dayjs from "dayjs";
import { useState } from "react";
import { Badge, Pagination, Table, Title } from "@mantine/core";

import { useTelegram } from "@/context";
import { useListQuery } from "@/api/orders/hooks";

const titles = [
  "Дата",
  "Статус",
  "Копий",
  "Кол-во Файлов",
  "Срочность",
  "Комметарий",
];

export default function MyOrders() {
  const { user } = useTelegram();
  const [page, setPage] = useState(1);

  const { data } = useListQuery({ page, telegramId: String(user?.id) });

  const rows = data?.orders?.map((value) => (
    <Table.Tr key={value.id}>
      <Table.Td>{dayjs(value.createdAt).format("DD/MM/YYYY")}</Table.Td>
      <Table.Td>
        <Badge size="lg">{value.status}</Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="p-4">
      <Title order={2}>Мои заказы</Title>

      <Table stickyHeader>
        <Table.Thead>
          <Table.Tr>
            {titles?.map((title, index) => (
              <Table.Th key={index}>{title}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Pagination
        className="mt-2"
        onChange={setPage}
        total={data?.totalPages || 1}
      />
    </div>
  );
}
