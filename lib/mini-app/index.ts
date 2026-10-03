import type { MiniAppAdapter } from "./types";

export async function getMiniAppAdapter(
  search: string
): Promise<MiniAppAdapter> {
  // This only selects the SDK. The server verifies the launch data and identity.
  if (new URLSearchParams(search).has("vk_app_id")) {
    return (await import("./vk")).vkAdapter;
  }
  return (await import("./telegram")).telegramAdapter;
}
