"use client";

import Link from "next/link";
import { Button, type ButtonProps } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface BackButtonProps {
  text?: string;
  className?: string;
}

type BackButtonAction =
  { url: string; onClick?: never } | { url?: never; onClick: () => void };

export const BackButton = ({
  url,
  onClick,
  text,
  className,
}: BackButtonProps & BackButtonAction) => {
  const buttonProps: ButtonProps & { "aria-label": string } = {
    variant: "light",
    size: "md",
    radius: "xl",
    "aria-label": text || "Вернуться назад",
    className: twMerge("shrink-0", !text && "w-12 px-0", className),
    leftSection: text ? <ArrowLeft size={20} aria-hidden="true" /> : undefined,
  };
  const content = text || <ArrowLeft size={20} aria-hidden="true" />;
  return url ? (
    <Button {...buttonProps} component={Link} href={url}>
      {content}
    </Button>
  ) : (
    <Button {...buttonProps} type="button" onClick={onClick}>
      {content}
    </Button>
  );
};
