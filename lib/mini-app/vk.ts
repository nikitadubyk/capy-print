import bridge from "@vkontakte/vk-bridge";
import type { MiniAppAdapter } from "./types";

let initialization: Promise<unknown> | null = null;

export const vkAdapter: MiniAppAdapter = {
  platform: "vk",
  async initialize() {
    // Share Bridge initialization when React Strict Mode mounts twice.
    if (!initialization) initialization = bridge.send("VKWebAppInit");
    try {
      await initialization;
    } catch {
      initialization = null;
      throw new Error(
        "Не удалось запустить приложение во ВКонтакте. Попробуйте ещё раз."
      );
    }
    return window.location.search;
  },
};
