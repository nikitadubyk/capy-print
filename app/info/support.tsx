import Link from "next/link";
import { Button, Text, Title } from "@mantine/core";
import { Banknote, MapPin, MessageCircle, Plus } from "lucide-react";
import { homeLocation } from "@/config/home";
import { ContactLinks } from "@/components/contact-links";
import { RouteButton } from "@/components/route-button";
import { SectionCard } from "@/components/section-card";
import { Routes } from "@/config/routes";

export const InfoSupport = () => (
  <section
    id="support"
    className="mt-10 scroll-mt-6 md:mt-12"
    aria-labelledby="support-title"
  >
    <Title id="support-title" order={2}>
      Мы на связи
    </Title>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <SectionCard withBorder={false} className="flex flex-col bg-capy-blue">
        <MapPin
          size={26}
          className="mb-4 text-capy-accent"
          aria-hidden="true"
        />
        <Title order={3}>Копицентр {homeLocation.street}</Title>
        <Text component="address" className="mt-2 not-italic">
          {homeLocation.area}
        </Text>
        <Text className="mt-2">{homeLocation.directions}</Text>
        <div className="mt-5 flex items-center gap-2 border-t border-capy-accent/15 pt-4">
          <Banknote
            size={20}
            className="shrink-0 text-capy-accent"
            aria-hidden="true"
          />
          <Text fw={500}>Оплата при получении</Text>
        </div>
        <RouteButton className="mt-5" />
      </SectionCard>
      <SectionCard className="flex flex-col">
        <MessageCircle
          size={26}
          className="mb-4 text-capy-accent"
          aria-hidden="true"
        />
        <Title order={3}>Остался вопрос?</Title>
        <Text c="dimmed" className="mt-2">
          Напишите нам — поможем с файлом, настройками печати или получением
          заказа.
        </Text>
        <Text size="sm" c="dimmed" className="mt-3">
          {homeLocation.hoursNote}
        </Text>
        <ContactLinks className="mt-auto pt-5" />
      </SectionCard>
    </div>
    <div className="mt-8 border-t border-capy-line pt-6">
      <Button
        component={Link}
        href={Routes.Order}
        fullWidth
        size="lg"
        leftSection={<Plus size={20} aria-hidden="true" />}
      >
        Новый заказ
      </Button>
    </div>
  </section>
);
