import { cloneElement, JSX } from "react";
import { Paper } from "@mantine/core";

interface CardProps {
  text: string;
  title: string;
  icon: JSX.Element;
}

export const Card = ({ icon, text, title }: CardProps) => (
  <Paper radius="md" p="md" withBorder>
    <div className="flex gap-3 items-start">
      {cloneElement(icon, {
        size: 24,
        className: "text-teal-600 mt-1 shrink-0",
      })}
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  </Paper>
);
