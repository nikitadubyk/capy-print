"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, Text, Title } from "@mantine/core";
import { PageContainer } from "@/components/page-container";
import { SectionCard } from "@/components/section-card";
import { ArrowRight, Check, FolderOpen, Home, MapPin } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { Routes } from "@/config/routes";
import { homeLocation } from "@/config/home";
import type { MiniAppPlatform } from "@/types/mini-app-auth";
import Capybara from "@/public/images/capybara-success-v2.webp";

export const OrderSuccessPage = ({
  id,
  platform,
}: {
  id: string;
  platform: MiniAppPlatform | null;
}) => {
  const reducedMotion = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <PageContainer className="relative isolate flex flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-155 from-capy-blue via-capy-lilac/40 via-40% to-capy-canvas to-80%"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 -z-10 size-72 rounded-full border border-white/70 md:size-96"
        />
        <div className="flex flex-1 flex-col items-center py-5 text-center md:py-8">
          <div className="relative isolate mb-6 flex size-56 items-center justify-center md:size-72">
            <div
              aria-hidden="true"
              className="absolute inset-1 -z-10 rounded-full bg-white/60 ring-1 ring-white"
            />
            <m.div
              initial={
                reducedMotion ? false : { opacity: 0, y: 10, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full"
            >
              <Image
                src={Capybara}
                priority
                alt="Объёмная капибара в кепке держит коробку и показывает, что заказ принят"
                sizes="(min-width: 768px) 200px, 160px"
                className="h-full w-auto"
              />
            </m.div>
            <m.div
              initial={reducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              aria-hidden="true"
              className="absolute right-0 bottom-3 flex size-12 items-center justify-center rounded-full bg-capy-accent text-white ring-4 ring-capy-blue"
            >
              <Check size={26} />
            </m.div>
          </div>
          <Text variant="eyebrow" c="dimmed" className="mb-2">
            Всё получилось
          </Text>
          <Title order={2} component="h1">
            Заказ #{id} принят!
          </Title>
          <Text c="dimmed" className="mt-3 max-w-md">
            Заказ отправлен в копицентр. Следите за готовностью в «Моих
            заказах».
          </Text>
          {platform === "telegram" && (
            <Text size="sm" c="dimmed" className="mt-2 max-w-md">
              Когда печать будет готова, пришлём сообщение в Telegram.
            </Text>
          )}
          <SectionCard className="mt-6 w-full bg-white/80 p-4 text-left md:p-5">
            <div className="flex items-start gap-3">
              <MapPin
                size={22}
                className="mt-1 shrink-0 text-capy-accent"
                aria-hidden="true"
              />
              <div>
                <Text fw={600}>
                  Заберите и оплатите в копицентре {homeLocation.street}
                </Text>
                <Text size="sm" c="dimmed">
                  {homeLocation.area}
                </Text>
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="flex flex-col gap-3 pb-2">
          <Button
            component={Link}
            href={Routes.MyOrderDetail.replace(":id", id)}
            fullWidth
            size="lg"
            leftSection={<FolderOpen size={20} aria-hidden="true" />}
            rightSection={<ArrowRight size={20} aria-hidden="true" />}
          >
            Посмотреть заказ
          </Button>
          <Button
            component={Link}
            href={Routes.Home}
            fullWidth
            size="md"
            variant="light"
            leftSection={<Home size={20} aria-hidden="true" />}
          >
            На главную
          </Button>
        </div>
      </PageContainer>
    </LazyMotion>
  );
};
