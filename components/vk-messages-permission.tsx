"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Button, Modal, Stack, Text } from "@mantine/core";
import {
  useVkMessagesPermissionQuery,
  useSaveVkMessagesPreference,
} from "@/api/vk-messages/hooks";
import { vkMessagesPermissionTexts } from "@/config/vk-messages";
import { useMiniApp } from "@/context";
import { vkAdapter } from "@/lib/mini-app/vk";

export const VkMessagesPermission = () => {
  const { user, platform, loading, error } = useMiniApp();
  const [requesting, setRequesting] = useState<"allow" | "decline" | null>(
    null
  );
  const [notice, setNotice] = useState<
    keyof typeof vkMessagesPermissionTexts | null
  >(null);
  const inFlight = useRef(false);
  const active = platform === "vk" && !!user && !loading && !error;
  const { data, isPending, isError, isFetching, isFetched, refetch } =
    useVkMessagesPermissionQuery();
  const { mutateAsync: savePreference } = useSaveVkMessagesPreference();

  const chooseMessages = async (enabled: boolean) => {
    const groupId = data?.groupId;
    if (inFlight.current || !active || (enabled && !groupId)) return;
    inFlight.current = true;
    setRequesting(enabled ? "allow" : "decline");
    setNotice(null);
    try {
      let choice = enabled;
      if (enabled) {
        try {
          choice = await vkAdapter.allowMessagesFromGroup!(groupId!);
        } catch {
          setNotice("bridgeError");
          return;
        }
      }
      // The server verifies VK consent before saving an affirmative choice.
      await savePreference(choice);
    } catch (error) {
      setNotice(
        enabled && isAxiosError(error) && error.response?.status === 403
          ? "notConfirmed"
          : "saveError"
      );
    } finally {
      inFlight.current = false;
      setRequesting(null);
    }
  };

  const status =
    notice ??
    (isError
      ? "error"
      : isPending || isFetching
        ? "loading"
        : !data?.configured
          ? "unconfigured"
          : "request");

  return (
    <Modal
      opened={active && (data ? data.enabled === null : isFetched)}
      onClose={() => {}}
      title="Сообщения о заказе во ВКонтакте"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
    >
      <Stack gap="sm" aria-live="polite">
        <Text size="sm">{vkMessagesPermissionTexts[status]}</Text>
        <Button
          type="button"
          color="teal"
          loading={requesting === "allow"}
          disabled={!data?.configured || isFetching || !!requesting}
          onClick={() => void chooseMessages(true)}
        >
          Разрешить сообщения
        </Button>
        <Button
          type="button"
          color="gray"
          variant="default"
          loading={requesting === "decline"}
          disabled={!!requesting}
          onClick={() => void chooseMessages(false)}
        >
          Без сообщений
        </Button>
        {(isError || data?.configured === false) && (
          <Button
            type="button"
            variant="subtle"
            color="teal"
            loading={isFetching}
            disabled={!!requesting}
            onClick={() => {
              setNotice(null);
              void refetch();
            }}
          >
            Проверить снова
          </Button>
        )}
      </Stack>
    </Modal>
  );
};
