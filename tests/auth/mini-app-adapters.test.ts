import assert from "node:assert/strict";
import { test } from "node:test";
import bridge from "@vkontakte/vk-bridge";
import { getMiniAppAdapter } from "@/lib/mini-app";

test("platform adapters select the SDK and initialize VK before exposing launch data", async (t) => {
  const telegram = await getMiniAppAdapter("");
  assert.equal(telegram.platform, "telegram");
  await assert.rejects(
    telegram.initialize(),
    /Откройте приложение внутри Telegram/
  );

  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const search = "?vk_app_id=123&vk_user_id=42&vk_ts=1800000000&sign=test-only";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { search } },
  });
  t.after(() => {
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
  });

  const vk = await getMiniAppAdapter(search);
  assert.equal(vk.platform, "vk");
  const send = t.mock.method(bridge, "send", async () => {
    throw new Error("Bridge unavailable");
  });
  await assert.rejects(
    vk.initialize(),
    /Не удалось запустить приложение во ВКонтакте/
  );

  let complete: (value: { result: true }) => void = () => {};
  send.mock.mockImplementation(
    (() =>
      new Promise<{ result: true }>((resolve) => {
        complete = resolve;
      })) as typeof bridge.send
  );
  let returned = false;
  const first = vk.initialize().then((data) => {
    returned = true;
    return data;
  });
  const second = vk.initialize();
  await Promise.resolve();
  assert.equal(returned, false);
  assert.equal(send.mock.callCount(), 2); // Failed attempt, then one shared retry.
  assert.equal(send.mock.calls[1].arguments[0], "VKWebAppInit");
  complete({ result: true });
  assert.deepEqual(await Promise.all([first, second]), [search, search]);
  assert.equal(await vk.initialize(), search);
  assert.equal(send.mock.callCount(), 2);
  const profile = { id: 42, first_name: "Анна", last_name: "Иванова" };
  send.mock.mockImplementation((async () => profile) as typeof bridge.send);
  assert.deepEqual(await vk.getProfile!(), profile);
  assert.equal(send.mock.calls.at(-1)?.arguments[0], "VKWebAppGetUserInfo");
});
