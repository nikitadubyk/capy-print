import assert from "node:assert/strict";
import { test } from "node:test";

import { POST } from "@/app/api/auth/verify/route";
import {
  APP_ID,
  APP_SECRET,
  BOT_TOKEN,
  telegram,
  vk,
} from "@/tests/auth/fixtures";

function request(authorization?: string, body?: string) {
  const headers = new Headers({
    "x-telegram-id": "42",
    "x-mini-app-platform": "telegram",
  });
  if (authorization) headers.set("Authorization", authorization);
  return new Request("http://localhost/api/auth/verify?telegramId=42", {
    method: "POST",
    headers,
    body,
  });
}

test("HTTP authentication through Authorization", async (t) => {
  const keys = ["TELEGRAM_BOT_TOKEN", "VK_APP_ID", "VK_APP_SECRET"] as const;
  const original = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, i) => {
      if (original[i] === undefined) delete process.env[key];
      else process.env[key] = original[i];
    })
  );
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  process.env.VK_APP_ID = APP_ID;
  process.env.VK_APP_SECRET = APP_SECRET;
  const now = Math.floor(Date.now() / 1000);

  for (const platform of ["telegram", "vk"] as const) {
    const sign = platform === "telegram" ? telegram : vk;
    const timeKey = platform === "telegram" ? "auth_date" : "vk_ts";
    const raw = sign({ [timeKey]: String(now) });

    await t.test(
      `${platform}: header authenticates without reading the body`,
      async () => {
        const response = await POST(request(`${platform} ${raw}`, "{not-json"));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.headers.get("set-cookie"), null);
        assert.deepEqual(await response.json(), {
          identity: {
            platform,
            externalUserId:
              platform === "telegram" ? "4503599627370495" : "9007199254740993",
            issuedAt: now,
            expiresAt: now + 300,
          },
        });
      }
    );

    await t.test(
      `${platform}: changing the scheme cannot impersonate the other platform`,
      async () => {
        const other = platform === "telegram" ? "vk" : "telegram";
        assert.equal((await POST(request(`${other} ${raw}`))).status, 401);
      }
    );

    await t.test(
      `${platform}: expiry, future date and tampering are rejected`,
      async () => {
        for (const [credential, code] of [
          [sign({ [timeKey]: String(now - 301) }), "LAUNCH_DATA_EXPIRED"],
          [sign({ [timeKey]: String(now + 100) }), "LAUNCH_DATA_IN_FUTURE"],
          [
            raw.replace("hash=", "hash=bad").replace("sign=", "sign=bad"),
            "INVALID_LAUNCH_DATA",
          ],
        ]) {
          const response = await POST(request(`${platform} ${credential}`));
          assert.equal(response.status, 401);
          assert.equal(response.headers.get("cache-control"), "no-store");
          assert.deepEqual(await response.json(), {
            error: {
              code,
              message:
                "Данные запуска недействительны. Откройте приложение заново.",
            },
          });
        }
      }
    );

    await t.test(`${platform}: missing server secret returns 503`, async () => {
      const key =
        platform === "telegram" ? "TELEGRAM_BOT_TOKEN" : "VK_APP_SECRET";
      const previous = process.env[key];
      delete process.env[key];
      try {
        const response = await POST(request(`${platform} ${raw}`));
        assert.equal(response.status, 503);
        assert.equal((await response.json()).error.code, "AUTH_NOT_CONFIGURED");
      } finally {
        process.env[key] = previous;
      }
    });
  }

  await t.test("scheme names are case insensitive", async () => {
    assert.equal(
      (await POST(request(`TeLeGrAm ${telegram({ auth_date: String(now) })}`)))
        .status,
      200
    );
  });

  await t.test(
    "platform label, body and plain user ID cannot authenticate",
    async () => {
      for (const authorization of [
        undefined,
        "telegram",
        "vk",
        "Bearer 42",
        "telegram 42",
        "vk data extra",
        `vk ${"x".repeat(16385)}`,
      ]) {
        const response = await POST(
          request(
            authorization,
            JSON.stringify({
              platform: "telegram",
              rawLaunchData: telegram({ auth_date: String(now) }),
              telegramId: 42,
            })
          )
        );
        assert.equal(response.status, 401);
      }
    }
  );

  await t.test("VK rejects another app with a valid signature", async () => {
    const response = await POST(
      request(`vk ${vk({ vk_ts: String(now), vk_app_id: "999" })}`)
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNEXPECTED_APP");
  });
});
