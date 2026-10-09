import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";
import {
  clearClientSession,
  establishSession,
  getClientSession,
  updateClientSessionUser,
} from "@/store/api/session";
import { apiInstance } from "@/store/api/instance";
import { usersApi } from "@/store/api/users";

test("profile loading saves via Bearer before updating session and ignores revoked sessions", async (t) => {
  clearClientSession();
  t.after(clearClientSession);
  const user = {
    id: 6,
    role: "USER" as const,
    telegramId: null,
    firstName: null,
    lastName: null,
    username: null,
  };
  const token = "vk_" + "a".repeat(43);
  const profile = {
    id: 42,
    first_name: "Анна",
    last_name: "Иванова",
    photo_200: "https://example.test/avatar.jpg",
  };
  const updatedUser = { ...user, firstName: "Анна", lastName: "Иванова" };
  const login = t.mock.method(axios.Axios.prototype, "request", async () => ({
    data: { token, platform: "vk", user },
  }));
  await establishSession("vk", "test-launch-data");
  login.mock.restore();
  const previousAdapter = apiInstance.defaults.adapter;
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
  });
  let started = Promise.withResolvers<void>();
  let finish = Promise.withResolvers<void>();
  apiInstance.defaults.adapter = async (config) => {
    assert.equal(config.method, "patch");
    assert.equal(config.baseURL, "/api/");
    assert.equal(config.url, "user");
    assert.equal(config.timeout, 10_000);
    assert.equal(config.headers.get("Authorization"), `Bearer ${token}`);
    assert.deepEqual(JSON.parse(config.data), profile);
    started.resolve();
    await finish.promise;
    return {
      data: { user: updatedUser },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const saveProfile = async () => {
    const savedUser = await usersApi.updateVkProfile(profile);
    updateClientSessionUser(savedUser, token);
  };
  const loading = saveProfile();
  await started.promise;
  assert.equal(getClientSession()?.user.firstName, null);
  finish.resolve();
  await loading;
  assert.equal(getClientSession()?.user.firstName, "Анна");
  assert.equal(getClientSession()?.token, token);
  started = Promise.withResolvers<void>();
  finish = Promise.withResolvers<void>();
  const lateResponse = saveProfile();
  await started.promise;
  clearClientSession();
  finish.resolve();
  await lateResponse;
  assert.equal(getClientSession(), null);
  updateClientSessionUser(updatedUser, "vk_other-token");
  assert.equal(getClientSession(), null);
});

test("profile saving failure preserves the previously loaded profile", async (t) => {
  clearClientSession();
  t.after(clearClientSession);
  const token = "vk_" + "a".repeat(43);
  const user = {
    id: 6,
    role: "USER" as const,
    telegramId: null,
    firstName: "Старое имя",
    lastName: null,
    username: null,
  };
  const login = t.mock.method(axios.Axios.prototype, "request", async () => ({
    data: { token, platform: "vk", user },
  }));
  await establishSession("vk", "test-launch-data");
  login.mock.restore();
  const previousAdapter = apiInstance.defaults.adapter;
  t.after(() => {
    apiInstance.defaults.adapter = previousAdapter;
  });
  apiInstance.defaults.adapter = async () => {
    throw new Error("Network unavailable");
  };
  await assert.rejects(
    usersApi.updateVkProfile({
      id: 42,
      first_name: "Анна",
      last_name: "Иванова",
    }),
    /Network unavailable/
  );
  assert.equal(getClientSession()?.user.firstName, "Старое имя");
});
