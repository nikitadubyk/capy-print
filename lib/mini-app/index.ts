import type { MiniAppAdapter } from "./types";

export const getMiniAppAdapter = async (
  search: string
): Promise<MiniAppAdapter> => {
  // This only selects the SDK. The server verifies the launch data and identity.
  if (new URLSearchParams(search).has("vk_app_id")) {
    return (await import("./vk")).vkAdapter;
  }
  const { telegramAdapter, isTelegramMiniApp } = await import("./telegram");
  if (isTelegramMiniApp()) return telegramAdapter;
  const { vkAdapter, isVkMiniApp } = await import("./vk");
  return isVkMiniApp() ? vkAdapter : telegramAdapter;
};
