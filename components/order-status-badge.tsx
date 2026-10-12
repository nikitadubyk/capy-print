import { Badge, darken } from "@mantine/core";

import { OrderStatus } from "@/app/generated/prisma/enums";
import { OrderStatusColor, OrderStatusTitle } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <Badge
    variant="light"
    color={OrderStatusColor[status]}
    bg={`${OrderStatusColor[status]}.0`}
    styles={(theme) => ({
      root: { color: darken(theme.colors[OrderStatusColor[status]][9], 0.25) },
    })}
    className="shrink-0"
  >
    {OrderStatusTitle[status]}
  </Badge>
);
