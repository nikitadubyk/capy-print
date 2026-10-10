import Link from "next/link";
import { Button, Text } from "@mantine/core";
import { ArrowRight, Banknote, FolderOpen, Printer } from "lucide-react";

import { Routes } from "@/config/routes";

export const HomeActions = ({ isAdmin }: { isAdmin: boolean }) => (
  <nav
    className="mb-10 flex flex-col gap-3 md:mb-16"
    aria-label={isAdmin ? "Работа с заказами" : "Заказ печати"}
  >
    <Button
      component={Link}
      href={isAdmin ? Routes.AdminOrders : Routes.Order}
      size="lg"
      radius="xl"
      fullWidth
      leftSection={isAdmin ? <FolderOpen size={24} /> : <Printer size={24} />}
      rightSection={<ArrowRight size={24} />}
      className="shadow-sm"
      classNames={{
        inner: "justify-between",
        label: "flex-1 justify-start pl-2",
      }}
    >
      {isAdmin ? "Заказы клиентов" : "Новый заказ"}
    </Button>
    {!isAdmin && (
      <Button
        component={Link}
        href={Routes.MyOrders}
        variant="outline"
        size="lg"
        radius="xl"
        fullWidth
        leftSection={<FolderOpen size={24} />}
        rightSection={<ArrowRight size={24} />}
        className="bg-white"
        classNames={{
          inner: "justify-between",
          label: "flex-1 justify-start pl-2",
        }}
      >
        Мои заказы
      </Button>
    )}
    <div className="flex items-center justify-center gap-2 pt-1">
      <Banknote size={20} className="text-capy-muted" aria-hidden="true" />
      <Text size="sm" c="dimmed">
        Оплата при получении
      </Text>
    </div>
  </nav>
);
