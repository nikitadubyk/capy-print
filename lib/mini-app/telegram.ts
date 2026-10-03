import {
  backButton,
  init,
  isTMA,
  retrieveRawInitData,
} from "@tma.js/sdk-react";
import type { MiniAppAdapter } from "./types";

let initialized = false;

export const telegramAdapter: MiniAppAdapter = {
  platform: "telegram",
  async initialize() {
    if (typeof window === "undefined" || !isTMA()) {
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
