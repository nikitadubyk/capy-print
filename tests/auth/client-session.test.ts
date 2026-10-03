import assert from "node:assert/strict";
import { test } from "node:test";
import axios, { type Axios } from "axios";
import {
  establishSession,
  clearClientSession,
  getSessionHeaders,
  getClientSession,
  subscribeSession,
} from "@/api/session";

test("Axios startup shares a request, uses prefixed Bearer and notifies React without DOM events", async (t) => {
  clearClientSession();
  t.after(clearClientSession);
  const response = {
    token: "vk_" + "b".repeat(43),
    platform: "vk",
    user: {
      id: 1,
      role: "USER",
      telegramId: null,
      username: null,
      firstName: null,
      lastName: null,
    },
  };
  const mockRequest = t.mock.method(
    axios.Axios.prototype,
    "request",
    async function (this: Axios, config: any) {
      assert.equal(this.defaults.baseURL, "/api/auth/");
      assert.equal(this.defaults.withCredentials, false);
      assert.equal(config.url, "session");
      assert.equal(config.method, "post");
      assert.equal(config.headers.Authorization, "vk test-only-launch-data");
      return { data: response };
    }
  );
  let notifications = 0;
  const unsubscribe = subscribeSession(() => {
    notifications++;
  });
  t.after(unsubscribe);
  const [first, second] = await Promise.all([
    establishSession("vk", "test-only-launch-data"),
    establishSession("vk", "test-only-launch-data"),
  ]);
  assert.deepEqual(first, response);
  assert.deepEqual(second, response);
  assert.equal(mockRequest.mock.callCount(), 1);
  assert.equal(notifications, 1);
  assert.deepEqual(getSessionHeaders(), {
    Authorization: `Bearer ${response.token}`,
  });
  assert.equal(getClientSession(), first);
  t.mock.timers.enable({
    apis: ["Date"],
    now: Date.now() + 90 * 24 * 60 * 60 * 1000,
  });
  assert.deepEqual(
    await establishSession("vk", "test-only-launch-data"),
    response
  );
  assert.equal(mockRequest.mock.callCount(), 1);
  t.mock.timers.reset();
  clearClientSession();
  assert.deepEqual(getSessionHeaders(), {});
  assert.equal(notifications, 2);
  mockRequest.mock.mockImplementation(async () => {
    throw new axios.AxiosError(
      "Unauthorized",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 401,
        data: { error: { message: "Откройте приложение заново." } },
      } as any
    );
  });
  await assert.rejects(
    establishSession("vk", "bad-data"),
    /Откройте приложение заново/
  );
  assert.deepEqual(getSessionHeaders(), {});
  mockRequest.mock.mockImplementation(async () => ({ data: response }));
  await establishSession("vk", "fresh-data");
  unsubscribe();
  const lastNotifications = notifications;
  clearClientSession();
  assert.equal(notifications, lastNotifications);
});
