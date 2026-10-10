import { type ReactNode } from "react";
import { Text } from "@mantine/core";

interface CardProps {
  title: string;
  children: ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
  <div className="flex min-w-0 flex-col gap-2">
    <Text fw={500}>{title}</Text>
    {children}
  </div>
);
