"use client";

import { forwardRef } from "react";
import {
  createPolymorphicComponent,
  Paper,
  type PaperProps,
} from "@mantine/core";
import { twMerge } from "tailwind-merge";

const SectionCardBase = forwardRef<HTMLDivElement, PaperProps>(
  ({ className, ...props }, ref) => (
    <Paper
      ref={ref}
      withBorder
      radius="xl"
      {...props}
      className={twMerge("bg-white p-5 md:p-6", className)}
    />
  )
);

SectionCardBase.displayName = "SectionCard";

export const SectionCard = createPolymorphicComponent<"div", PaperProps>(
  SectionCardBase
);
