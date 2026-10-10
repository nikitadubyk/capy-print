import type { ReactNode } from "react";
import { Text } from "@mantine/core";
import type { LucideIcon } from "lucide-react";

export const OrderDetailField = ({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-2">
    <Icon
      size={18}
      className="mt-1 shrink-0 text-capy-muted"
      aria-hidden="true"
    />
    <div className="min-w-0 wrap-anywhere">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {children}
    </div>
  </div>
);
