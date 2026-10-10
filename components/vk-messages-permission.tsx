"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { isAxiosError } from "axios";
import { ActionIcon, Button, Modal, Stack, Text } from "@mantine/core";
import { Bell } from "lucide-react";
import {
  useVkMessagesPermissionQuery,
  useSaveVkMessagesPreference,
} from "@/store/api/vk-messages/hooks";
import { vkMessagesPermissionTexts } from "@/config/vk-messages";
import { useMiniApp } from "@/context";
import { vkAdapter } from "@/lib/mini-app/vk";

const VkMessagesDialogContext = createContext<{
  open: () => void;
  opened: boolean;
  active: boolean;
} | null>(null);

export const VkMessagesPermissionButton = () => {
  const dialog = useContext(VkMessagesDialogContext);
  if (!dialog?.active) return null;
  return (
    <ActionIcon
      variant="light"
      aria-label="Настройки уведомлений ВКонтакте"
      aria-haspopup="dialog"
      aria-expanded={dialog.opened}
      onClick={dialog.open}
      className="shrink-0"
    >
      <Bell size={24} aria-hidden="true" />
    </ActionIcon>
  );
};

export const VkMessagesPermission = ({ children }: PropsWithChildren) => {
  const { user, platform, loading, error } = useMiniApp();
  const [requesting, setRequesting] = useState<"allow" | "decline" | null>(
    null
  );
  const [notice, setNotice] = useState<
    keyof typeof vkMessagesPermissionTexts | null
  >(null);
  const inFlight = useRef(false);
  const active = platform === "vk" && !!user && !loading && !error;
  const [manualOpened, setManualOpened] = useState(false);
  const { data, isPending, isError, isFetching, isFetched, refetch } =
    useVkMessagesPermissionQuery();
  const { mutateAsync: savePreference } = useSaveVkMessagesPreference();
  const opened =
    active && (manualOpened || (data ? data.enabled === null : isFetched));
  const busy = requesting !== null;
  const canCloseDialog = manualOpened && !busy;
  const dialogTitle = manualOpened
    ? "Уведомления о заказах"
    : "Сообщения о заказе во ВКонтакте";
  const close = () => {
    if (!inFlight.current) setManualOpened(false);
  };
  const open = () => {
    if (!active) return;
    setNotice(null);
    setManualOpened(true);
    void refetch();
  };

  const chooseMessages = async (enabled: boolean) => {
    const groupId = data?.groupId;
    if (inFlight.current || !active || (enabled && !groupId)) return;
    inFlight.current = true;
    setRequesting(enabled ? "allow" : "decline");
    setNotice(null);
    try {
      if (enabled) {
        try {
          const permissionGranted = await vkAdapter.allowMessagesFromGroup!(
            groupId!
          );
          if (!permissionGranted) {
            setNotice("notConfirmed");
            return;
          }
        } catch {
          setNotice("bridgeError");
          return;
        }
      }
      // The server verifies VK consent before saving an affirmative choice.
      await savePreference(enabled);
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
          : manualOpened && data?.enabled != null
            ? data.enabled
              ? "enabled"
              : "disabled"
            : "request");

  return (
    <VkMessagesDialogContext.Provider value={{ open, opened, active }}>
      {children}
      <Modal
        opened={opened}
        onClose={close}
        title={dialogTitle}
        withCloseButton={canCloseDialog}
        closeOnClickOutside={canCloseDialog}
        closeOnEscape={canCloseDialog}
        closeButtonProps={{ "aria-label": "Закрыть настройки уведомлений" }}
      >
        <Stack gap="sm" aria-live="polite">
          <Text size="sm">{vkMessagesPermissionTexts[status]}</Text>
          <Button
            type="button"
            loading={requesting === "allow"}
            disabled={
              !data?.configured ||
              isFetching ||
              busy ||
              (manualOpened && data.enabled === true)
            }
            onClick={() => void chooseMessages(true)}
          >
            {manualOpened ? "Включить уведомления" : "Разрешить сообщения"}
          </Button>
          <Button
            type="button"
            variant="default"
            loading={requesting === "decline"}
            disabled={
              busy || (manualOpened && (isFetching || data?.enabled === false))
            }
            onClick={() => void chooseMessages(false)}
          >
            {manualOpened ? "Выключить уведомления" : "Без сообщений"}
          </Button>
          {(isError || data?.configured === false) && (
            <Button
              type="button"
              variant="subtle"
              loading={isFetching}
              disabled={busy}
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
    </VkMessagesDialogContext.Provider>
  );
};
