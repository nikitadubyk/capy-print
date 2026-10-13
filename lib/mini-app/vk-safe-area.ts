import type {
  Insets,
  VKBridgeEvent,
  AnyReceiveMethodName,
} from "@vkontakte/vk-bridge";

const sides = ["top", "right", "bottom", "left"] as const;

export const normalizeVkInsets = (value: unknown): Insets | null => {
  if (!value || typeof value !== "object") return null;
  const insets = value as Record<string, unknown>;
  if (
    !sides.every(
      (side) =>
        typeof insets[side] === "number" &&
        Number.isFinite(insets[side]) &&
        insets[side] >= 0
    )
  )
    return null;
  return {
    top: insets.top as number,
    right: insets.right as number,
    // VK can report keyboard height here. Like VK Bridge React, do not use it as page padding.
    bottom: (insets.bottom as number) > 150 ? 0 : (insets.bottom as number),
    left: insets.left as number,
  };
};

interface SafeAreaBridge {
  isWebView(): boolean;
  subscribe(
    handler: (event: VKBridgeEvent<AnyReceiveMethodName>) => void
  ): void;
  unsubscribe(
    handler: (event: VKBridgeEvent<AnyReceiveMethodName>) => void
  ): void;
}

export const subscribeVkSafeArea = (
  bridge: SafeAreaBridge,
  root: HTMLElement,
  getConfig: () => Promise<unknown>
) => {
  let active = true;
  let receivedUpdate = false;
  const mobile = bridge.isWebView();
  if (mobile) root.setAttribute("data-vk-webview", "true");
  const applyConfig = (data: unknown) => {
    if (!active || !data || typeof data !== "object" || !("insets" in data))
      return;
    const insets = normalizeVkInsets(data.insets);
    if (!insets) return;
    for (const side of sides)
      root.style.setProperty(`--vk-safe-area-${side}`, `${insets[side]}px`);
  };
  const handler = ({ detail }: VKBridgeEvent<AnyReceiveMethodName>) => {
    if (
      detail.type !== "VKWebAppUpdateConfig" &&
      detail.type !== "VKWebAppUpdateInsets"
    )
      return;
    if ("insets" in detail.data && normalizeVkInsets(detail.data.insets))
      receivedUpdate = true;
    applyConfig(detail.data);
  };
  // Subscribe before VKWebAppInit: the first config can arrive during initialization.
  bridge.subscribe(handler);
  void getConfig()
    .then((config) => {
      if (!receivedUpdate) applyConfig(config);
    })
    .catch(() => {
      // Older clients can omit GetConfig. Keep CSS fallbacks and listen for updates.
    });
  return () => {
    active = false;
    bridge.unsubscribe(handler);
    if (mobile) root.removeAttribute("data-vk-webview");
    for (const side of sides)
      root.style.removeProperty(`--vk-safe-area-${side}`);
  };
};
