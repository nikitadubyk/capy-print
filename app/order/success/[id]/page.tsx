"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button, Title } from "@mantine/core";

import { Routes } from "@/config";
import CapybaraDelivery from "@/public/images/delivery.png";

export default function Success() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col min-h-dvh p-4">
      <div className="flex flex-col gap-4 items-center text-center m-auto">
        <Image src={CapybaraDelivery} alt="Доставка капибара" height={250} />

        <Title order={2}>Заказ #{id} принят!</Title>
        <div>
          <p>Мы уже греем принтеры.</p>
          <p>Пришлем вам уведомление в чат когда все будет готово.</p>
        </div>
      </div>

      <Button
        color="gray"
        component={Link}
        href={Routes.Home}
        className="mt-auto"
      >
        Вернуться на главную
      </Button>
    </div>
  );
}
