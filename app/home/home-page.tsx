"use client";

import { Text } from "@mantine/core";
import { PageContainer } from "@/components/page-container";

import { HomeActions } from "./actions";
import { HomeContacts } from "./contacts";
import { HomeHeader } from "./header";
import { HomeHero } from "./hero";
import { HomeLocation } from "./location";
import { HomeServices } from "./services";
import { HomeSteps } from "./steps";

export const HomePage = ({ isAdmin = false }: { isAdmin?: boolean }) => (
  <PageContainer className="relative isolate max-w-5xl pt-[max(16px,env(safe-area-inset-top))] pr-[max(16px,env(safe-area-inset-right))] pb-[max(24px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] text-capy-ink md:px-10 [&_:focus-visible]:outline-3 [&_:focus-visible]:outline-offset-4 [&_:focus-visible]:outline-capy-accent">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-128 bg-linear-155 from-capy-blue via-capy-lilac/30 via-30% to-capy-canvas to-80% md:h-176 md:rounded-b-3xl"
    />
    <HomeHeader />
    <HomeHero />
    <HomeActions isAdmin={isAdmin} />
    <HomeServices />
    <HomeSteps />
    <HomeLocation />
    <HomeContacts />
    <footer className="flex w-full justify-between pt-6 md:mt-5">
      <Text size="sm" fw={600} c="dimmed">
        Capy Print.
      </Text>
      <Text size="sm" c="dimmed">
        Горловка
      </Text>
    </footer>
  </PageContainer>
);
