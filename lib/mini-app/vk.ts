import bridge from "@vkontakte/vk-bridge";
import type { MiniAppAdapter } from "./types";
import { MINI_APP_STARTUP_TIMEOUT_MS } from "@/config/mini-app";

let initialization: Promise<unknown> | null = null;

export const isVkMiniApp = () =>
  typeof window !== "undefined" && bridge.isEmbedded();

const withBridgeTimeout = <T>(
  operation: () => Promise<T>,
  message: string
): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `${message} ВКонтакте не ответил вовремя. Попробуйте снова.`
          )
        ),
      MINI_APP_STARTUP_TIMEOUT_MS
    );
    // Handle late responses/rejections as well; they must not revive a timed-out attempt.
    Promise.resolve()
      .then(operation)
      .then(
        (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        () => {
          clearTimeout(timer);
          reject(new Error(`${message} Попробуйте снова.`));
        }
      );
  });

const initializeBridge = () => {
  if (!initialization)
    initialization = withBridgeTimeout(
      () => bridge.send("VKWebAppInit"),
      "Не удалось запустить приложение во ВКонтакте."
    ).catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  return initialization;
};

const getLaunchData = async () => {
  const search = window.location.search;
  const query = new URLSearchParams(search);
  if (
    ["vk_app_id", "vk_user_id", "vk_ts", "sign"].every((key) => query.has(key))
  )
    return search;

  const data = await withBridgeTimeout(
    () => bridge.send("VKWebAppGetLaunchParams"),
    "Не удалось получить параметры запуска VK."
  );
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(
      "VK вернул некорректные параметры запуска. Откройте приложение заново."
    );
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (key !== "sign" && !key.startsWith("vk_")) continue;
    if (value === undefined) continue;
    if (
      typeof value !== "string" &&
      !(typeof value === "number" && Number.isSafeInteger(value))
    )
      throw new Error(
        "VK вернул некорректные параметры запуска. Откройте приложение заново."
      );
    params.set(key, String(value));
  }
  if (
    !["vk_app_id", "vk_user_id", "vk_ts", "sign"].every((key) =>
      params.get(key)
    )
  )
    throw new Error(
      "VK не вернул подписанные параметры запуска. Откройте приложение заново."
    );
  // Never replace vk_ts or reconstruct sign: the server verifies these exact values.
  return params.toString();
};

export const vkAdapter: MiniAppAdapter = {
  platform: "vk",
  getProfile: () =>
    withBridgeTimeout(
      () => bridge.send("VKWebAppGetUserInfo"),
      "Не удалось получить профиль VK."
    ),
  allowMessagesFromGroup: async (groupId) => {
    if (
      !(await withBridgeTimeout(
        () => bridge.supportsAsync("VKWebAppAllowMessagesFromGroup"),
        "Не удалось проверить поддержку сообщений VK."
      ))
    )
      throw new Error("Запрос сообщений не поддерживается этим клиентом VK");
    const data = await bridge.send("VKWebAppAllowMessagesFromGroup", {
      group_id: groupId,
    });
    return data.result === true;
  },
  initialize: async () => {
    // Share initialization under Strict Mode and allow a fresh attempt after timeout/failure.
    await initializeBridge();
    return getLaunchData();
  },
};
