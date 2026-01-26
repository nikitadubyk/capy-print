"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge, Button, Title, ActionIcon } from "@mantine/core";
import { FileCheck, Folder, Sparkles, CircleQuestionMark } from "lucide-react";

import { Routes } from "@/config";
import { useTelegram } from "@/context";
import CapybaraWait from "@/public/images/wait.png";

import { UserRole } from "./generated/prisma/enums";

export default function Home() {
  const { role } = useTelegram();
  const isAdmin = role === UserRole.ADMIN;

  return (
    <div className="min-h-dvh flex flex-col bg-linear-to-b from-teal-50 to-white px-4 py-6">
      <div className="flex flex-col gap-4 m-auto text-center items-center">
        <div className="flex justify-between gap-4 items-center">
          <Badge
            size="lg"
            color="teal"
            variant="light"
            className="mx-auto"
            leftSection={<Sparkles size={14} />}
          >
            Быстро и удобно
          </Badge>

          <ActionIcon
            radius="md"
            color="gray"
            component={Link}
            href={Routes.Info}
          >
            <CircleQuestionMark size={16} />
          </ActionIcon>
        </div>
        <Title order={1}>Печать без стресса</Title>

        <Image height={264} alt="Капибара" loading="eager" src={CapybaraWait} />

        <p>Загрузите файлы, а мы и капибары все сделаем.</p>
      </div>

      {isAdmin && (
        <Button
          fullWidth
          size="lg"
          radius="md"
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
            size="lg"
            fullWidth
            radius="md"
            color="teal"
            component={Link}
            href={Routes.Order}
            leftSection={<FileCheck />}
          >
            Новый заказ
          </Button>
          <Button
            fullWidth
            size="lg"
            radius="md"
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
