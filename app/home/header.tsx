"use client";

import Link from "next/link";
import { ActionIcon, Text } from "@mantine/core";
import { HelpCircle, Printer } from "lucide-react";

import { Routes } from "@/config/routes";
import { useMiniApp } from "@/context";
import { VkMessagesPermissionButton } from "@/components/vk-messages-permission";

export const HomeHeader = () => {
  const { platform } = useMiniApp();
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {platform === "vk" ? (
          <VkMessagesPermissionButton />
        ) : (
          <Printer
            size={24}
            className="shrink-0 text-capy-accent"
            aria-hidden="true"
          />
        )}
        <div>
          <Text variant="brand">
            Capy Print<span className="text-capy-accent">.</span>
          </Text>
          <Text size="sm" c="dimmed">
            Копицентр в Горловке
          </Text>
        </div>
      </div>
      <ActionIcon
        variant="subtle"
        component={Link}
        href={Routes.Info}
        aria-label="Помощь и частые вопросы"
      >
        <HelpCircle size={24} />
      </ActionIcon>
    </header>
  );
};
