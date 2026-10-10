import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { apiInstance } from "@/store/api/instance";
import { clearClientSession, establishSession } from "@/store/api/session";
import {
  saveVkMessagesPreferenceOptions,
  vkMessagesPermissionOptions,
} from "@/store/api/vk-messages/queries";

test("VK permission query waits for initialization and caches a saved decision only for its owner", async (t) => {
  clearClientSession();
  t.after(clearClientSession);
  const token = `vk_${"a".repeat(43)}`;
  const user = {
    id: 7,
    role: "USER" as const,
    telegramId: null,
    username: null,
    firstName: null,
    lastName: null,
  };
  const login = t.mock.method(axios.Axios.prototype, "request", async () => ({
    data: { token, platform: "vk", user },
  }));
  await establishSession("vk", "test-only-launch");
  login.mock.restore();
  const previousAdapter = apiInstance.defaults.adapter;
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
  });
  let requests = 0;
  let failSave = false;
  const initial = {
    configured: true,
    groupId: 123,
    allowed: false,
    enabled: null as boolean | null,
  };
  apiInstance.defaults.adapter = async (config) => {
    requests++;
    assert.equal(config.url, "vk/messages/permission");
    assert.equal(config.headers.get("Authorization"), `Bearer ${token}`);
    const isPost = config.method === "post";
    if (isPost && failSave) throw new Error("Save failed");
    const data = isPost
      ? { ...initial, enabled: JSON.parse(config.data).enabled }
      : initial;
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  const client = new QueryClient();
  t.after(() => client.clear());
  const observer = new QueryObserver(
    client,
    vkMessagesPermissionOptions(user.id, false)
  );
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  assert.equal(requests, 0);
  observer.setOptions(vkMessagesPermissionOptions(user.id, true));
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.enabled, null);
  const before = requests;
  const mutation = client
    .getMutationCache()
    .build(client, saveVkMessagesPreferenceOptions(client, user.id));
  await mutation.execute(false);
  assert.equal(requests, before + 1);
  assert.equal(observer.getCurrentResult().data?.enabled, false);
  assert.equal(
    client.getQueryData(vkMessagesPermissionOptions(8, true).queryKey),
    undefined
  );
  const reopened = new QueryObserver(
    client,
    vkMessagesPermissionOptions(user.id, true)
  );
  const stop = reopened.subscribe(() => {});
  t.after(stop);
  assert.equal(reopened.getCurrentResult().data?.enabled, false);
  assert.equal(requests, before + 1); // No needless GET when the component mounts again.
  failSave = true;
  await assert.rejects(mutation.execute(true), /Save failed/);
  assert.equal(observer.getCurrentResult().data?.enabled, false);
});

test("unconfigured VK messages are checked again after remount and manual retry", async (t) => {
  const previousAdapter = apiInstance.defaults.adapter;
  const client = new QueryClient();
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
    client.clear();
  });
  let configured = false;
  let requests = 0;
  apiInstance.defaults.adapter = async (config) => {
    requests++;
    return {
      data: {
        configured,
        groupId: configured ? 123 : null,
        allowed: configured ? false : null,
        enabled: null,
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const options = vkMessagesPermissionOptions(7, true);
  await client.fetchQuery(options);
  assert.equal(requests, 1);
  configured = true;
  const observer = new QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  t.after(stop);
  await observer.refetch({ cancelRefetch: false });
  assert.equal(requests, 2); // An unconfigured response is no longer cached forever.
  assert.equal(observer.getCurrentResult().data?.configured, true);

  configured = false;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.configured, false);
  configured = true;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.groupId, 123);
});

test("an older permission GET cannot overwrite the saved VK decision", async (t) => {
  const previousAdapter = apiInstance.defaults.adapter;
  const client = new QueryClient();
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
    client.clear();
  });
  const permission = {
    configured: true,
    groupId: 123,
    allowed: false,
    enabled: null as boolean | null,
  };
  const options = vkMessagesPermissionOptions(7, true);
  client.setQueryData(options.queryKey, permission);
  const started = Promise.withResolvers<void>();
  const finishGet = Promise.withResolvers<void>();
  let signal: AbortSignal | undefined;
  apiInstance.defaults.adapter = async (config) => {
    const isPost = config.method === "post";
    if (!isPost) {
      signal = config.signal as AbortSignal;
      started.resolve();
      await finishGet.promise;
    }
    return {
      data: isPost ? { ...permission, enabled: false } : permission,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const observer = new QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  t.after(stop);
  await started.promise;
  const mutation = client
    .getMutationCache()
    .build(client, saveVkMessagesPreferenceOptions(client, 7));
  await mutation.execute(false);
  assert.equal(signal?.aborted, true);
  assert.equal(observer.getCurrentResult().data?.enabled, false);
  finishGet.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(observer.getCurrentResult().data?.enabled, false);
});

test("VK notification settings can be enabled, disabled and enabled again without losing another user's preference", async (t) => {
  const previousAdapter = apiInstance.defaults.adapter;
  const client = new QueryClient();
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
    client.clear();
  });
  const permission = {
    configured: true,
    groupId: 123,
    allowed: false,
    enabled: false,
  };
  const options = vkMessagesPermissionOptions(7, true);
  const otherOptions = vkMessagesPermissionOptions(8, true);
  client.setQueryData(options.queryKey, permission);
  client.setQueryData(otherOptions.queryKey, permission);
  const choices: boolean[] = [];
  apiInstance.defaults.adapter = async (config) => {
    assert.equal(config.method, "post");
    assert.equal(config.url, "vk/messages/permission");
    const { enabled } = JSON.parse(config.data) as { enabled: boolean };
    choices.push(enabled);
    return {
      data: { ...permission, enabled, allowed: enabled },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const mutation = client
    .getMutationCache()
    .build(client, saveVkMessagesPreferenceOptions(client, 7));
  for (const enabled of [true, false, true]) {
    await mutation.execute(enabled);
    assert.equal(
      client.getQueryData<{ enabled: boolean }>(options.queryKey)?.enabled,
      enabled
    );
    assert.equal(
      client.getQueryData<{ enabled: boolean }>(otherOptions.queryKey)?.enabled,
      false
    );
  }
  assert.deepEqual(choices, [true, false, true]);
});
