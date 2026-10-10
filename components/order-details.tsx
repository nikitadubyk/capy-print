import dayjs from "dayjs";
import Link from "next/link";
import { Anchor, Badge, Divider, Text, Title } from "@mantine/core";
import { File, Clock, User, FileText, Copy } from "lucide-react";

import { Order, PaperSizeTitle, Urgency, UrgencyViewTitle } from "@/types";
import { getCustomerContact } from "@/lib/customer";

import { OrderStatusBadge } from "./order-status-badge";
import { OrderDetailField } from "./order-detail-field";
import { SectionCard } from "./section-card";

interface OrderDetailsProps {
  data: Order;
  isAdmin?: boolean;
}

export const OrderDetails = ({ data, isAdmin = false }: OrderDetailsProps) => {
  const customer = getCustomerContact(data.user);
  const createdAt = dayjs(data.createdAt);
  const deadline = data.deadlineAt ? dayjs(data.deadlineAt) : null;
  const deadlineLabel = deadline?.isValid()
    ? deadline.format("DD.MM.YYYY · HH:mm")
    : data.deadlineAt;
  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={data.status} />
          <div className="flex items-center gap-2 text-capy-muted">
            <Clock size={16} aria-hidden="true" />
            <Text
              component="time"
              dateTime={createdAt.toISOString()}
              size="sm"
              c="dimmed"
            >
              {createdAt.format("DD.MM.YYYY HH:mm")}
            </Text>
          </div>
        </div>
      </div>

      <SectionCard className="mb-6">
        <Title order={3} className="mb-4">
          Детали заказа
        </Title>

        <div className="space-y-2">
          {isAdmin && data.user && (
            <>
              <OrderDetailField icon={User} label="Клиент">
                <Text fw={500}>{customer.name}</Text>
              </OrderDetailField>

              <OrderDetailField icon={User} label="Платформа и связь">
                <Text fw={500}>{customer.platform}</Text>
                {customer.profileUrl && (
                  <Anchor
                    size="sm"
                    href={customer.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Открыть профиль
                  </Anchor>
                )}
                {customer.messageUrl && (
                  <Anchor
                    size="sm"
                    display="block"
                    href={customer.messageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Написать клиенту
                  </Anchor>
                )}
              </OrderDetailField>
            </>
          )}

          {data.urgency && (
            <OrderDetailField icon={Clock} label="Срочность">
              <Badge
                variant="light"
                color={data.urgency === Urgency.ASAP ? "red" : "gray"}
              >
                {UrgencyViewTitle[data.urgency]}
              </Badge>
            </OrderDetailField>
          )}

          {data.deadlineAt && (
            <OrderDetailField icon={Clock} label="К какому времени заказ">
              <Text fw={500}>{deadlineLabel}</Text>
            </OrderDetailField>
          )}

          {data.comment && (
            <OrderDetailField icon={FileText} label="Комментарий">
              <Text fw={500} className="whitespace-pre-wrap">
                {data.comment}
              </Text>
            </OrderDetailField>
          )}
        </div>
      </SectionCard>

      <div className="space-y-4">
        <Title order={3}>Печать ({data.printJobs.length})</Title>

        {data.printJobs.map((job, index) => (
          <SectionCard key={job.id}>
            <div className="mb-3">
              <Title order={4} className="mb-3">
                Печать #{index + 1}
              </Title>

              <div className="flex flex-wrap gap-2">
                <Badge
                  color="capyBlue"
                  variant="light"
                  leftSection={<Copy size={14} />}
                >
                  {job.copies} {job.copies === 1 ? "копия" : "копии"}
                </Badge>

                <Badge variant="light" color={job.isColor ? "pink" : "gray"}>
                  {job.isColor ? "Цветная" : "Ч/Б"}
                </Badge>

                <Badge variant="light" color="gray">
                  {PaperSizeTitle[job.paperSize || ""]}
                </Badge>

                {job.duplex && (
                  <Badge variant="light" color="capyBlue">
                    Двусторонняя
                  </Badge>
                )}
              </div>
            </div>

            <Divider className="my-3" />

            <div>
              <Text size="sm" c="dimmed" fw={500} className="mb-2">
                Файлы ({job.files.length})
              </Text>

              <div className="space-y-2">
                {job.files.map((file) => (
                  <Link
                    key={file.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={file.fileUrl}
                    className="flex items-center gap-3 rounded-md bg-capy-blue/20 p-3 transition-colors duration-150 hover:bg-capy-blue/40 motion-reduce:transition-none"
                  >
                    <File
                      size={20}
                      className="text-capy-accent shrink-0"
                      aria-hidden="true"
                    />

                    <div className="flex-1 min-w-0">
                      <Text size="sm" fw={500} truncate>
                        {file.fileName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </Text>
                    </div>

                    <Text
                      component="span"
                      size="sm"
                      c="capyBlue"
                      fw={500}
                      className="shrink-0"
                    >
                      Открыть
                    </Text>
                  </Link>
                ))}
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </>
  );
};
