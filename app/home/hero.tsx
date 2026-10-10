"use client";

import Image from "next/image";
import { Text, Title } from "@mantine/core";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";

import Capybara from "@/public/images/capybara-home-v2.webp";

export const HomeHero = () => {
  const reducedMotion = useReducedMotion();
  return (
    <section className="py-4 md:py-10" aria-labelledby="home-title">
      <Text variant="eyebrow" c="dimmed">
        Онлайн-заказ печати
      </Text>
      <div className="relative mt-3 min-h-48 md:mt-6 md:min-h-64">
        <Title id="home-title" order={1} className="relative z-10">
          Печать
          <br />
          <span className="text-capy-accent">
            документов
            <br />и фото
          </span>
        </Title>
        <div className="absolute right-0 bottom-0 w-1/2 max-w-40 sm:w-52 sm:max-w-none md:w-80">
          <LazyMotion features={domAnimation} strict>
            <m.div
              className="relative isolate flex aspect-square items-end"
              initial={false}
              animate={reducedMotion ? { y: 0 } : { y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: 1, ease: "easeInOut" }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-2 -z-10 rounded-full bg-linear-to-br from-capy-blue to-capy-lilac/60 ring-1 ring-white"
              />
              <Image
                src={Capybara}
                alt="Капибара с чашкой кофе и готовыми документами — символ нашего копицентра"
                priority
                sizes="(max-width: 639px) 160px, (max-width: 767px) 208px, 320px"
                className="block h-auto w-full"
              />
            </m.div>
          </LazyMotion>
        </div>
      </div>
      <Text size="sm" c="dimmed" className="mt-4 max-w-sm">
        Загрузите файлы здесь, заберите готовый заказ в нашем копицентре.
      </Text>
    </section>
  );
};
