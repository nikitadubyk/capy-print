import { Badge } from "@mantine/core";

import { OrderStatus } from "@/app/generated/prisma/enums";
import { OrderStatusColor, OrderStatusTitle } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <Badge
    variant="light"
    color={`${OrderStatusColor[status]}.8`}
    className="shrink-0"
  >
    {OrderStatusTitle[status]}
  </Badge>
);
