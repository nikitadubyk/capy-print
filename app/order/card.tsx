import { JSX } from "react";
import { Text } from "@mantine/core";

interface CardProps {
  title: string;
  children: JSX.Element;
}

export const Card = ({ title, children }: CardProps) => (
  <div className="flex justify-between">
    <Text size="sm">{title}:</Text>
    {children}
  </div>
);
