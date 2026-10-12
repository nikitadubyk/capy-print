"use client";

import Link from "next/link";
import { Badge, Button, Text, Title } from "@mantine/core";
import {
  ArrowRight,
  FileText,
  Images,
  Palette,
  Gift,
  Clock,
  MapPin,
} from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { WorkGallery } from "@/components/work-gallery";
import { ContactLinks } from "@/components/contact-links";
import { RouteButton } from "@/components/route-button";
import { homeLocation } from "@/config/home";
import { Routes } from "@/config/routes";
import { serviceGroups, shopSupplies, workExamples } from "@/config/services";

const serviceIcons = {
  documents: FileText,
  photos: Images,
  design: Palette,
  gifts: Gift,
};

export const ServicesPage = () => (
  <PageContainer className="max-w-5xl pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:px-10">
    <PageHeader title="Услуги и наши работы" backUrl={Routes.Home} />
    <section
      className="rounded-3xl bg-capy-blue p-6 md:p-8"
      aria-labelledby="services-intro-title"
    >
      <Text variant="eyebrow" className="mb-3">
        Копицентр на Центральном рынке
      </Text>
      <Title order={2} id="services-intro-title">
        От документа
        <br />
        до памятного подарка.
      </Title>
      <Text className="mt-4 max-w-2xl">
        Печатаем, фотографируем, восстанавливаем снимки и помогаем с дизайном.
        Работаем на профессиональной технике с оригинальными расходными
        материалами.
      </Text>
      <Text c="dimmed" className="mt-3 max-w-2xl">
        Печать документов и фото можно оформить в приложении. Для остальных
        услуг напишите нам или приходите в копицентр — обсудим задачу, стоимость
        и срок.
      </Text>
      <Button
        component={Link}
        href={Routes.Order}
        size="lg"
        rightSection={<ArrowRight size={20} aria-hidden="true" />}
        className="mt-6"
      >
        Заказать печать
      </Button>
    </section>
    <section className="mt-10 md:mt-12" aria-labelledby="examples-title">
      <Title id="examples-title" order={2} className="mb-5">
        Сделано в нашем копицентре
      </Title>
      <WorkGallery works={workExamples} withFilters />
    </section>
    <section className="mt-10 md:mt-12" aria-labelledby="services-list-title">
      <Title id="services-list-title" order={2}>
        Чем можем помочь
      </Title>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {serviceGroups.map(({ id, title, description, items }) => {
          const Icon = serviceIcons[id];
          return (
            <SectionCard key={id}>
              <Icon
                size={28}
                className="mb-4 text-capy-accent"
                aria-hidden="true"
              />
              <Title order={3}>{title}</Title>
              <Text size="sm" c="dimmed" className="mt-2">
                {description}
              </Text>
              <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-capy-accent">
                {items.map((item) => (
                  <li key={item}>
                    <Text>{item}</Text>
                  </li>
                ))}
              </ul>
            </SectionCard>
          );
        })}
      </div>
    </section>
    <SectionCard className="mt-6">
      <Title order={3}>Можно купить на месте</Title>
      <Text c="dimmed" className="mt-2">
        В копицентре есть всё нужное для документов, учёбы и хранения
        фотографий.
      </Text>
      <ul className="mt-4 flex flex-wrap gap-2">
        {shopSupplies.map((item) => (
          <li key={item}>
            <Badge variant="light" color="capyBlue" size="lg">
              {item}
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
    <section
      className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2"
      aria-label="Сроки и посещение копицентра"
    >
      <SectionCard className="flex flex-col">
        <Clock size={28} className="mb-4 text-capy-accent" aria-hidden="true" />
        <Title order={2}>Когда будет готово?</Title>
        <Text className="mt-3">
          Срок зависит от объёма печати, сложности ретуши или макета и
          выбранного изделия. Согласуем его с вами при обращении.
        </Text>
        <Text size="sm" c="dimmed" className="mt-3">
          Пришлите файл или фото и расскажите, что нужно сделать и к какой дате.
          Информация на фотографиях образцов может отличаться от актуальных
          условий заказа.
        </Text>
        <ContactLinks className="mt-auto pt-6" showArrow />
      </SectionCard>
      <SectionCard className="bg-capy-lilac/40">
        <MapPin
          size={28}
          className="mb-4 text-capy-accent"
          aria-hidden="true"
        />
        <Title order={2}>Ждём на Изотова, 7</Title>
        <Text component="address" className="mt-3 not-italic">
          Горловка, ул. Изотова, 7. На пересечении улиц М. Тореза и Изотова,
          рядом с ТД «Донбасс» (Стройленд).
        </Text>
        <dl className="mt-5 space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Вторник — пятница</dt>
            <dd className="font-semibold">8:00–13:30</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Суббота — воскресенье</dt>
            <dd className="font-semibold">8:00–12:00</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Понедельник</dt>
            <dd>Выходной</dd>
          </div>
        </dl>
        <Text size="sm" c="dimmed" className="mt-4">
          {homeLocation.hoursNote}
        </Text>
        <RouteButton className="mt-5" />
      </SectionCard>
    </section>
  </PageContainer>
);
