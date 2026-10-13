import assert from "node:assert/strict";
import { test } from "node:test";
import type { AnyReceiveMethodName, VKBridgeEvent } from "@vkontakte/vk-bridge";
import {
  normalizeVkInsets,
  subscribeVkSafeArea,
} from "@/lib/mini-app/vk-safe-area";

test("VK insets accept zero and landscape values, reject malformed data and exclude keyboard height", () => {
  assert.deepEqual(
    normalizeVkInsets({ top: 44, right: 0, bottom: 34, left: 0 }),
    { top: 44, right: 0, bottom: 34, left: 0 }
  );
  assert.deepEqual(
    normalizeVkInsets({ top: 0, right: 44, bottom: 21, left: 44 }),
    { top: 0, right: 44, bottom: 21, left: 44 }
  );
  assert.equal(
    normalizeVkInsets({ top: 0, right: 0, bottom: 300, left: 0 })?.bottom,
    0
  );
  for (const value of [
    null,
    {},
    { top: -1, right: 0, bottom: 0, left: 0 },
    { top: 44, right: 0, bottom: NaN, left: 0 },
    { top: "44", right: 0, bottom: 0, left: 0 },
  ])
    assert.equal(normalizeVkInsets(value), null);
});

const createFixture = (mobile = true) => {
  const attributes = new Map<string, string>();
  const styles = new Map<string, string>();
  const handlers = new Set<
    (event: VKBridgeEvent<AnyReceiveMethodName>) => void
  >();
  const root = {
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    removeAttribute: (key: string) => attributes.delete(key),
    style: {
      setProperty: (key: string, value: string) => styles.set(key, value),
      removeProperty: (key: string) => styles.delete(key),
    },
  } as unknown as HTMLElement;
  const bridge = {
    isWebView: () => mobile,
    subscribe: (
      handler: (event: VKBridgeEvent<AnyReceiveMethodName>) => void
    ) => {
      handlers.add(handler);
    },
    unsubscribe: (
      handler: (event: VKBridgeEvent<AnyReceiveMethodName>) => void
    ) => {
      handlers.delete(handler);
    },
  };
  const emit = (insets: unknown, type = "VKWebAppUpdateConfig") => {
    for (const handler of handlers)
      handler({
        detail: { type, data: { insets } },
      } as VKBridgeEvent<AnyReceiveMethodName>);
  };
  return { root, bridge, attributes, styles, handlers, emit };
};

test("VK subscribes before initial config, follows updates and ignores a stale config response", async () => {
  const fixture = createFixture();
  let resolveConfig!: (config: unknown) => void;
  const dispose = subscribeVkSafeArea(fixture.bridge, fixture.root, () => {
    assert.equal(fixture.handlers.size, 1);
    return new Promise((resolve) => {
      resolveConfig = resolve;
    });
  });
  assert.equal(fixture.attributes.get("data-vk-webview"), "true");
  fixture.emit({ top: 44, right: 0, bottom: 34, left: 0 });
  fixture.emit(
    { top: 0, right: 44, bottom: 21, left: 44 },
    "VKWebAppUpdateInsets"
  );
  resolveConfig({ insets: { top: 44, right: 0, bottom: 34, left: 0 } });
  await Promise.resolve();
  assert.equal(fixture.styles.get("--vk-safe-area-top"), "0px");
  assert.equal(fixture.styles.get("--vk-safe-area-left"), "44px");
  fixture.emit({ top: 0, right: 44, bottom: 300, left: 44 });
  assert.equal(fixture.styles.get("--vk-safe-area-bottom"), "0px");
  dispose();
  assert.equal(fixture.handlers.size, 0);
  assert.equal(fixture.styles.size, 0);
  assert.equal(fixture.attributes.size, 0);
});

test("VK applies initial config, tolerates unsupported GetConfig and ignores responses after cleanup", async () => {
  const fixture = createFixture(false);
  const dispose = subscribeVkSafeArea(
    fixture.bridge,
    fixture.root,
    async () => ({ insets: { top: 0, right: 0, bottom: 0, left: 0 } })
  );
  await Promise.resolve();
  assert.equal(fixture.attributes.size, 0);
  assert.equal(fixture.styles.get("--vk-safe-area-top"), "0px");
  dispose();
  const disposeFailure = subscribeVkSafeArea(
    fixture.bridge,
    fixture.root,
    async () => {
      throw new Error("Unsupported");
    }
  );
  await Promise.resolve();
  fixture.emit({ top: 44, right: 0, bottom: 34, left: 0 });
  assert.equal(fixture.styles.get("--vk-safe-area-top"), "44px");
  disposeFailure();
  const disposeLate = subscribeVkSafeArea(
    fixture.bridge,
    fixture.root,
    async () => ({ insets: { top: 44, right: 0, bottom: 34, left: 0 } })
  );
  disposeLate();
  await Promise.resolve();
  assert.equal(fixture.styles.size, 0);
});
