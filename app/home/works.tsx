"use client";

import Link from "next/link";
import { Button, Text, Title } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import { featuredWorks } from "@/config/services";
import { Routes } from "@/config/routes";
import { WorkGallery } from "@/components/work-gallery";

export const HomeWorks = () => (
  <section className="mt-12 md:mt-16" aria-labelledby="works-title">
    <Text variant="eyebrow" c="dimmed" className="mb-3">
      Больше, чем печать
    </Text>
    <div className="mb-6 grid gap-4 md:grid-cols-2 md:items-end md:gap-8">
      <Title id="works-title" order={2}>
        Ваши идеи.
        <br />
        Наши работы.
      </Title>
      <Text c="dimmed">
        Мы делаем фото на документы, восстанавливаем старые снимки, печатаем
        визитки, сувениры и адресные таблички. Вот несколько примеров.
      </Text>
    </div>
    <WorkGallery works={featuredWorks} />
    <Button
      component={Link}
      href={Routes.Services}
      variant="outline"
      size="lg"
      fullWidth
      rightSection={<ArrowRight size={20} aria-hidden="true" />}
      className="mt-6"
    >
      Услуги и все примеры работ
    </Button>
  </section>
);
