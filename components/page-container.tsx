import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export const PageContainer = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"main">) => (
  <main
    {...props}
    className={twMerge(
      "capy-page mx-auto min-h-dvh w-full max-w-4xl",
      className
    )}
  />
);
