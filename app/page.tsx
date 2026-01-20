"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, Title } from "@mantine/core";
import { FileCheck, Folder } from "lucide-react";

import { Routes } from "@/config";
import CapybaraWait from "@/public/images/wait.png";

export default function Home() {
  return (
    <div className="p-6 flex flex-col gap-4 min-h-dvh items-center">
      <div className="flex flex-col gap-4 m-auto">
        <Title order={1}>Печать без стресса</Title>

        <Image src={CapybaraWait} alt="Капибара" />

        <p className="text-center">
          Загрузите файлы, а мы и капибары все сделаем.
        </p>
      </div>

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
          leftSection={<Folder />}
          href={Routes.CompleteOrders}
        >
          Мои заказы
        </Button>
      </div>
    </div>
  );
}
