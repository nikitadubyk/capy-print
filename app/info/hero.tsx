"use client";

import Image from "next/image";
import { Button, Text, Title } from "@mantine/core";
import { ArrowDown, MapPin } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import Capybara from "@/public/images/capybara-faq-v2.webp";

export const InfoHero = () => {
  const reducedMotion = useReducedMotion();
  return (
    <section
      className="overflow-hidden rounded-3xl bg-linear-135 from-capy-blue via-capy-blue/50 to-capy-lilac/60 p-5 md:p-8"
      aria-labelledby="faq-title"
    >
      <div className="grid items-center gap-5 sm:grid-cols-2 md:gap-8">
        <div>
          <Text variant="eyebrow" c="dimmed">
            Capy Print рядом
          </Text>
          <Title id="faq-title" order={2} className="mt-2">
            Всё о вашем заказе
          </Title>
          <Text c="dimmed" className="mt-3">
            От загрузки файла до получения печати. Собрали ответы, чтобы каждый
            шаг был понятным.
          </Text>
        </div>
        <LazyMotion features={domAnimation} strict>
          <m.div
            className="relative isolate mx-auto flex size-44 items-center justify-center sm:size-56 md:size-64"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-1 -z-10 rounded-full bg-white/60 ring-1 ring-white"
            />
            <Image
              src={Capybara}
              alt="Объёмная капибара читает лист бумаги"
              priority
              sizes="(min-width: 768px) 256px, (min-width: 640px) 224px, 176px"
              className="h-full w-auto"
            />
          </m.div>
        </LazyMotion>
      </div>
      <nav
        className="mt-6 grid gap-3 sm:grid-cols-2"
        aria-label="Разделы помощи"
      >
        <Button
          component="a"
          href="#questions"
          fullWidth
          rightSection={<ArrowDown size={18} aria-hidden="true" />}
        >
          К вопросам
        </Button>
        <Button
          component="a"
          href="#support"
          fullWidth
          variant="default"
          leftSection={<MapPin size={18} aria-hidden="true" />}
        >
          Где забрать
        </Button>
      </nav>
    </section>
  );
};
