import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import {
  MantineProvider,
  mantineHtmlProps,
  ColorSchemeScript,
} from "@mantine/core";

import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { TelegramProvider } from "@/context";

import { QueryProvider } from "./query-provider";

export const metadata: Metadata = {
  title: "Capy Print - Онлайн печать документов и фотографий",
  keywords: ["печать документов", "онлайн печать", "печать pdf", "печать фото"],
  description:
    "Профессиональная печать документов, фотографий и презентаций онлайн. Удобный интерфейс, гибкие настройки, быстрая обработка заказов. Печатайте из дома или офиса!",
  openGraph: {
    title: "Capy Print - Онлайн сервис печати",
    description: "Быстрая печать документов и фотографий",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className="bg-zinc-100">
        <MantineProvider>
          <QueryProvider>
            <TelegramProvider>{children}</TelegramProvider>
          </QueryProvider>
        </MantineProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
