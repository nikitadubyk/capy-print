import {
  backButton,
  init,
  isTMA,
  retrieveRawInitData,
} from "@tma.js/sdk-react";
import type { MiniAppAdapter } from "./types";

let initialized = false;

export const isTelegramMiniApp = () => {
  if (typeof window === "undefined") return false;
  try {
    return isTMA();
  } catch {
    // SDK discovery can fail when browser storage is unavailable in an iframe.
    return false;
  }
};

export const telegramAdapter: MiniAppAdapter = {
  platform: "telegram",
  initialize: async () => {
    if (!isTelegramMiniApp()) {
      throw new Error("Откройте приложение внутри Telegram или ВКонтакте.");
    }
    if (!initialized) {
      init();
      if (backButton.mount.isAvailable() && !backButton.isMounted())
        backButton.mount();
      initialized = true;
    }
    return retrieveRawInitData() ?? "";
  },
};
