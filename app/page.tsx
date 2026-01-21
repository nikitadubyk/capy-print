"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, Title } from "@mantine/core";
import { FileCheck, Folder } from "lucide-react";

import { Routes } from "@/config";
import { useTelegram } from "@/context";
import CapybaraWait from "@/public/images/wait.png";

import { UserRole } from "./generated/prisma/enums";

export default function Home() {
  const { role } = useTelegram();
  const isAdmin = role === UserRole.ADMIN;

  return (
    <div className="p-6 flex flex-col gap-4 min-h-dvh items-center">
      <div className="flex flex-col gap-4 m-auto text-center">
        <Title order={1}>Печать без стресса</Title>

        <Image src={CapybaraWait} alt="Капибара" />

        <p>Загрузите файлы, а мы и капибары все сделаем.</p>
      </div>

      {isAdmin && (
        <Button
          fullWidth
          color="teal"
          component={Link}
          leftSection={<Folder />}
          href={Routes.AdminOrders}
        >
          Заказы
        </Button>
      )}

      {!isAdmin && (
        <div className="flex flex-col gap-2 w-full mt-auto">
          <Button
            fullWidth
            color="teal"
            component={Link}
            href={Routes.Order}
            leftSection={<FileCheck />}
          >
            Новый заказ
          </Button>
          <Button
            fullWidth
            color="gray"
            component={Link}
            href={Routes.MyOrders}
            leftSection={<Folder />}
          >
            Мои заказы
          </Button>
        </div>
      )}
    </div>
  );
}
