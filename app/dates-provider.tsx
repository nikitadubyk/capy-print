"use client";

import { PropsWithChildren } from "react";
import { DatesProvider as MantineDatesProvider } from "@mantine/dates";

import "dayjs/locale/ru";

export const DatesProvider = ({ children }: PropsWithChildren) => (
  <MantineDatesProvider settings={{ locale: "ru" }}>
    {children}
  </MantineDatesProvider>
);
