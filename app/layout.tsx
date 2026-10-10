import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { mantineHtmlProps, ColorSchemeScript } from "@mantine/core";

import "./globals.css";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import "@mantine/dropzone/styles.layer.css";

import { MiniAppProvider } from "@/context";
import { VkMessagesPermission } from "@/components/vk-messages-permission";

import { DatesProvider } from "./dates-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

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

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="ru" {...mantineHtmlProps}>
    <head>
      <ColorSchemeScript defaultColorScheme="light" forceColorScheme="light" />
    </head>
    <body className="bg-capy-canvas text-capy-ink">
      <ThemeProvider>
        <DatesProvider>
          <QueryProvider>
            <MiniAppProvider>
              <VkMessagesPermission>{children}</VkMessagesPermission>
            </MiniAppProvider>
          </QueryProvider>
        </DatesProvider>
      </ThemeProvider>
      <Toaster position="top-center" />
    </body>
  </html>
);

export default RootLayout;
