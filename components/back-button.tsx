"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  url: string;
  text?: string;
  className?: string;
}

export const BackButton = ({ url, text, className }: BackButtonProps) => (
  <Button
    href={url}
    component={Link}
    variant="transparent"
    className={className}
    leftSection={<ArrowLeft />}
  >
    {text || "Вернуться назад"}
  </Button>
);
