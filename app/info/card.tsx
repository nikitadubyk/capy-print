import { Text, Title } from "@mantine/core";
import { SectionCard } from "@/components/section-card";
import type { LucideIcon } from "lucide-react";

interface CardProps {
  text: string;
  title: string;
  icon: LucideIcon;
  number: number;
}

export const Card = ({ icon: Icon, text, title, number }: CardProps) => (
  <SectionCard className="h-full md:p-5">
    <div className="mb-4 flex items-center justify-between">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-capy-blue text-capy-accent">
        <Icon size={22} aria-hidden="true" />
      </span>
      <Text variant="eyebrow" c="dimmed">
        0{number}
      </Text>
    </div>
    <Title order={3}>{title}</Title>
    <Text c="dimmed" className="mt-2">
      {text}
    </Text>
  </SectionCard>
);
