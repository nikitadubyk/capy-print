import dayjs from "dayjs";
import Link from "next/link";
import { Title, Badge, Divider } from "@mantine/core";
import { File, Clock, User, FileText, Copy } from "lucide-react";

import { Order, PaperSizeTitle, Urgency, UrgencyViewTitle } from "@/types";

import { OrderStatusBadge } from "./order-status-badge";

interface OrderDetailsProps {
  data: Order;
  id?: string;
}

export const OrderDetails = ({ id, data }: OrderDetailsProps) => (
  <>
    <div className="mb-6">
      <Title order={2} className="mb-4">
        Заказ #{id}
      </Title>
      <div className="flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={data.status} />
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={16} />
          <span className="text-sm">
            {dayjs(data.createdAt).format("DD.MM.YYYY HH:mm")}
          </span>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="font-semibold text-lg mb-3">Детали заказа</h3>

      <div className="space-y-2">
        {data.user && (
          <>
            <div className="flex items-start gap-2">
              <User size={18} className="text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Клиент</p>
                <p className="font-medium">{data.user.username}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={18} className="text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Имя</p>
                <p className="font-medium">{data.user.firstName}</p>
              </div>
            </div>
          </>
        )}

        {data.urgency && (
          <div className="flex items-start gap-2">
            <Clock size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Срочность</p>
              <Badge
                variant="light"
                color={data.urgency === Urgency.ASAP ? "red" : "gray"}
              >
                {UrgencyViewTitle[data.urgency]}
              </Badge>
            </div>
          </div>
        )}

        {data.deadlineAt && (
          <div className="flex items-start gap-2">
            <Clock size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">К какому времени заказ</p>
              <p className="font-medium">{data.deadlineAt}</p>
            </div>
          </div>
        )}

        {data.comment && (
          <div className="flex items-start gap-2">
            <FileText size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Комментарий</p>
              <p className="font-medium">{data.comment}</p>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Печать ({data.printJobs.length})
      </h3>

      {data.printJobs.map((job, index) => (
        <div
          key={job.id}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="mb-3">
            <h4 className="font-semibold text-base mb-2">
              Печать #{index + 1}
            </h4>

            <div className="flex flex-wrap gap-2">
              <Badge
                color="blue"
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
                <Badge variant="light" color="teal">
                  Двусторонняя
                </Badge>
              )}
            </div>
          </div>

          <Divider className="my-3" />

          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">
              Файлы ({job.files.length})
            </p>

            <div className="space-y-2">
              {job.files.map((file) => (
                <Link
                  key={file.id}
                  target="_blank"
                  href={file.fileUrl}
                  className="flex items-center gap-3 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <File size={20} className="text-blue-600 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <span className="text-xs text-blue-600 font-medium shrink-0">
                    Открыть
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);
