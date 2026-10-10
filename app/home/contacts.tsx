import Link from "next/link";
import { Text, Title, UnstyledButton } from "@mantine/core";
import { ArrowRight } from "lucide-react";

import { ContactLinks } from "@/components/contact-links";
import { Routes } from "@/config/routes";

export const HomeContacts = () => (
  <section className="mt-10 w-full md:mt-12" aria-labelledby="contact-title">
    <Title id="contact-title" order={2}>
      Нужна помощь с файлом?
    </Title>
    <Text c="dimmed" className="mt-2">
      Напишите нам — поможем с заказом.
    </Text>
    <ContactLinks className="mt-5" showArrow />
    <UnstyledButton
      component={Link}
      href={Routes.Info}
      className="mt-3 flex w-full items-center justify-between gap-3 border-b border-capy-line py-6 transition-colors duration-150 hover:text-capy-accent active:text-capy-accent motion-reduce:transition-none"
    >
      <Text component="span">Помощь и частые вопросы</Text>
      <ArrowRight size={20} className="shrink-0" aria-hidden="true" />
    </UnstyledButton>
  </section>
);
