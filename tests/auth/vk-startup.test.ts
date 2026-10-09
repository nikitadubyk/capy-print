import assert from "node:assert/strict";
import { test } from "node:test";
import bridge from "@vkontakte/vk-bridge";
import { getMiniAppAdapter } from "@/lib/mini-app";
import { vkAdapter } from "@/lib/mini-app/vk";
import { MINI_APP_STARTUP_TIMEOUT_MS } from "@/config/mini-app";
import { verifyMiniAppAuth } from "@/lib/mini-app-auth/verify";
import { config, NOW, vk } from "./fixtures";

test("VK reload recovery and bounded automatic Bridge calls without network", async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { search: "", href: "https://example.test/my-orders" } },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  });
  const embedded = t.mock.method(bridge, "isEmbedded", () => true);
  const send = t.mock.method(
    bridge,
    "send",
    (async () => ({})) as typeof bridge.send
  );

  await t.test(
    "reload without query selects VK; standalone still uses Telegram",
    async () => {
      assert.equal((await getMiniAppAdapter("")).platform, "vk");
      embedded.mock.mockImplementation(() => false);
      assert.equal((await getMiniAppAdapter("")).platform, "telegram");
      embedded.mock.mockImplementation(() => true);
    }
  );

  await t.test(
    "Telegram launch data takes priority over generic iframe detection",
    async (t) => {
      const params = new URLSearchParams({
        tgWebAppVersion: "8.0",
        tgWebAppPlatform: "web",
        tgWebAppThemeParams: "{}",
      });
      const storageDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        "sessionStorage"
      );
      Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
      });
      t.after(() => {
        window.location.href = "https://example.test/my-orders";
        if (storageDescriptor)
          Object.defineProperty(
            globalThis,
            "sessionStorage",
            storageDescriptor
          );
        else Reflect.deleteProperty(globalThis, "sessionStorage");
      });
      window.location.href = `https://example.test/#${params}`;
      assert.equal((await getMiniAppAdapter("")).platform, "telegram");
    }
  );

  await t.test(
    "init timeout can retry and late responses cannot revive the old attempt",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let complete: (value: { result: true }) => void = () => {};
      send.mock.mockImplementation(
        (() =>
          new Promise<{ result: true }>((resolve) => {
            complete = resolve;
          })) as typeof bridge.send
      );
      const failed = assert.rejects(
        vkAdapter.initialize(),
        /не ответил вовремя/
      );
      await Promise.resolve();
      t.mock.timers.tick(MINI_APP_STARTUP_TIMEOUT_MS);
      await failed;
      complete({ result: true });
      await Promise.resolve();
      await Promise.resolve();
    }
  );

  const signed = vk({
    vk_user_id: "42",
    vk_ref: "Капи + & = % 🦫",
    vk_custom: "signed extra",
  });
  const nativeParams: Record<string, string | number> = {
    ...Object.fromEntries(new URLSearchParams(signed)),
    vk_user_id: 42,
    vk_app_id: 123456,
    vk_ts: NOW,
    unsigned: "ignored",
  };
  let launchParams: unknown = nativeParams;
  send.mock.mockImplementation((async (method: string) =>
    method === "VKWebAppInit"
      ? { result: true }
      : launchParams) as typeof bridge.send);

  await t.test(
    "fallback keeps signed values intact and still requires server verification",
    async () => {
      const calls = send.mock.callCount();
      const rawLaunchData = await vkAdapter.initialize();
      assert.deepEqual(
        send.mock.calls.slice(calls).map((call) => call.arguments[0]),
        ["VKWebAppInit", "VKWebAppGetLaunchParams"]
      );
      const params = new URLSearchParams(rawLaunchData);
      assert.equal(params.get("unsigned"), null);
      assert.equal(params.get("vk_ref"), "Капи + & = % 🦫");
      assert.equal(params.get("sign"), nativeParams.sign);
      assert.equal(
        verifyMiniAppAuth({ platform: "vk", rawLaunchData }, config, NOW)
          .externalUserId,
        "42"
      );
      assert.throws(() =>
        verifyMiniAppAuth({ platform: "vk", rawLaunchData }, config, NOW + 301)
      );
      launchParams = { ...nativeParams, vk_user_id: 43 };
      const tampered = await vkAdapter.initialize();
      assert.throws(() =>
        verifyMiniAppAuth(
          { platform: "vk", rawLaunchData: tampered },
          config,
          NOW
        )
      );
    }
  );

  await t.test(
    "invalid native params cannot silently become launch data",
    async () => {
      for (const invalid of [
        null,
        [],
        {},
        { ...nativeParams, sign: undefined },
        { ...nativeParams, vk_user_id: Number.MAX_SAFE_INTEGER + 1 },
      ]) {
        launchParams = invalid;
        await assert.rejects(vkAdapter.initialize(), /параметры запуска/);
      }
      launchParams = Object.fromEntries(new URLSearchParams(vk()));
      const rawLaunchData = await vkAdapter.initialize();
      assert.equal(
        verifyMiniAppAuth({ platform: "vk", rawLaunchData }, config, NOW)
          .externalUserId,
        "9007199254740993"
      );
    }
  );

  await t.test(
    "launch params and profile requests time out instead of hanging",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      send.mock.mockImplementation(
        (() => new Promise(() => {})) as typeof bridge.send
      );
      for (const request of [vkAdapter.initialize, vkAdapter.getProfile!]) {
        const failed = assert.rejects(request(), /не ответил вовремя/);
        // initialize awaits the already completed shared initialization first.
        await Promise.resolve();
        await Promise.resolve();
        t.mock.timers.tick(MINI_APP_STARTUP_TIMEOUT_MS);
        await failed;
      }
    }
  );

  await t.test(
    "capability lookup times out; native consent has no short timer",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const supports = t.mock.method(
        bridge,
        "supportsAsync",
        () => new Promise<boolean>(() => {})
      );
      const calls = send.mock.callCount();
      const failed = assert.rejects(
        vkAdapter.allowMessagesFromGroup!(123),
        /не ответил вовремя/
      );
      await Promise.resolve();
      t.mock.timers.tick(MINI_APP_STARTUP_TIMEOUT_MS);
      await failed;
      assert.equal(send.mock.callCount(), calls);

      supports.mock.mockImplementation(async () => true);
      let complete: (value: { result: true }) => void = () => {};
      send.mock.mockImplementation(
        (() =>
          new Promise<{ result: true }>((resolve) => {
            complete = resolve;
          })) as typeof bridge.send
      );
      let settled = false;
      const consent = vkAdapter.allowMessagesFromGroup!(123).then((value) => {
        settled = true;
        return value;
      });
      // Drain the capability lookup before advancing beyond the automatic-call limit.
      for (let i = 0; i < 10; i++) await Promise.resolve();
      assert.equal(
        send.mock.calls.at(-1)?.arguments[0],
        "VKWebAppAllowMessagesFromGroup"
      );
      t.mock.timers.tick(MINI_APP_STARTUP_TIMEOUT_MS * 2);
      assert.equal(settled, false);
      complete({ result: true });
      assert.equal(await consent, true);
    }
  );
});
