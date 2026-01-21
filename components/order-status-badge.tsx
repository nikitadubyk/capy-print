import { Badge } from "@mantine/core";

import { OrderStatus } from "@/app/generated/prisma/enums";
import { OrderStatusColor, OrderStatusTitle } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <Badge size="lg" color={OrderStatusColor[status]}>
    {OrderStatusTitle[status]}
  </Badge>
);
