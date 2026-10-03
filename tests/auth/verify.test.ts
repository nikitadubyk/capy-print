import assert from "node:assert/strict";
import { test } from "node:test";
import { MiniAppAuthError } from "@/lib/mini-app-auth/common";
import { verifyMiniAppAuth } from "@/lib/mini-app-auth/verify";
import type {
  MiniAppAuthErrorCode,
  MiniAppPlatform,
} from "@/types/mini-app-auth";
import {
  APP_ID,
  APP_SECRET,
  BOT_TOKEN,
  config,
  NOW,
  replace,
  telegram,
  vk,
} from "@/tests/auth/fixtures";

function verify(platform: MiniAppPlatform, rawLaunchData: string, now = NOW) {
  return verifyMiniAppAuth({ platform, rawLaunchData }, config, now);
}

function rejects(
  fn: () => unknown,
  code: MiniAppAuthErrorCode = "INVALID_LAUNCH_DATA"
) {
  assert.throws(
    fn,
    (error) => error instanceof MiniAppAuthError && error.code === code
  );
}

test("Telegram: verified identity contains no raw data, profile, role or internal User.id", () => {
  const identity = verify(
    "telegram",
    telegram({ role: "ADMIN", signature: "signed-third-party-field" })
  );
  assert.deepEqual(identity, {
    platform: "telegram",
    externalUserId: "4503599627370495",
    issuedAt: NOW,
    expiresAt: NOW + 300,
  });
  assert.doesNotThrow(() => JSON.stringify(identity));
});

test("VK: decimal IDs are preserved without converting through Number", () => {
  assert.deepEqual(verify("vk", vk()), {
    platform: "vk",
    externalUserId: "9007199254740993",
    issuedAt: NOW,
    expiresAt: NOW + 300,
  });
});

test("identical Telegram/VK numeric IDs remain separate identities", () => {
  const tg = verify("telegram", telegram({ user: '{"id":42}' }));
  const vkIdentity = verify("vk", vk({ vk_user_id: "42" }));
  assert.equal(tg.externalUserId, vkIdentity.externalUserId);
  assert.notEqual(tg.platform, vkIdentity.platform);
});

for (const platform of ["telegram", "vk"] as const) {
  const sign = platform === "telegram" ? telegram : vk;
  const timeKey = platform === "telegram" ? "auth_date" : "vk_ts";
  const signatureKey = platform === "telegram" ? "hash" : "sign";
  test(`${platform}: valid reordered query with leading ? and encoded characters`, () => {
    const raw = sign({
      [platform === "telegram" ? "start_param" : "vk_ref"]:
        "Привет + % & = / !'()*~",
    });
    assert.equal(
      verify(platform, "?" + raw.split("&").reverse().join("&")).platform,
      platform
    );
  });
  test(`${platform}: wrong secret and cross-platform payload rejected`, () => {
    rejects(() => verify(platform, sign({}, "wrong-secret")));
    rejects(() =>
      verify(platform, platform === "telegram" ? vk() : telegram())
    );
  });
  test(`${platform}: tampered signed timestamp and identity rejected`, () => {
    rejects(() => verify(platform, replace(sign(), timeKey, String(NOW + 1))));
    const key = platform === "telegram" ? "user" : "vk_user_id";
    rejects(() =>
      verify(
        platform,
        replace(sign(), key, platform === "telegram" ? '{"id":7}' : "7")
      )
    );
  });
  test(`${platform}: expiry is exclusive, future skew is inclusive`, () => {
    assert.doesNotThrow(() => verify(platform, sign(), NOW + 299));
    rejects(() => verify(platform, sign(), NOW + 300), "LAUNCH_DATA_EXPIRED");
    rejects(() => verify(platform, sign(), NOW + 301), "LAUNCH_DATA_EXPIRED");
    assert.doesNotThrow(() =>
      verify(platform, sign({ [timeKey]: String(NOW + 30) }))
    );
    rejects(
      () => verify(platform, sign({ [timeKey]: String(NOW + 31) })),
      "LAUNCH_DATA_IN_FUTURE"
    );
  });
  for (const value of [
    undefined,
    "",
    "0",
    "-1",
    "1.5",
    "1e9",
    " 1800000000",
    "01800000000",
    "NaN",
    "Infinity",
    "9007199254740993",
  ]) {
    test(`${platform}: rejects timestamp ${String(value)}`, () => {
      rejects(() => verify(platform, sign({ [timeKey]: value })));
    });
  }
  for (const value of [
    "",
    "bad",
    "a".repeat(42),
    "g".repeat(64),
    "a".repeat(65),
  ]) {
    test(`${platform}: rejects malformed signature of length ${value.length}`, () => {
      rejects(() => verify(platform, replace(sign(), signatureKey, value)));
    });
  }
  test(`${platform}: missing signature rejected`, () => {
    const params = new URLSearchParams(sign());
    params.delete(signatureKey);
    rejects(() => verify(platform, params.toString()));
  });
  test(`${platform}: duplicate and encoded duplicate keys rejected`, () => {
    rejects(() => verify(platform, `${sign()}&${signatureKey}=duplicate`));
    rejects(() => verify(platform, `${sign()}&${timeKey}=${NOW}`));
    const encodedKey = `%${timeKey.charCodeAt(0).toString(16)}${timeKey.slice(1)}`;
    rejects(() => verify(platform, `${sign()}&${encodedKey}=${NOW}`));
  });
  test(`${platform}: malformed encoding in a signed value cannot bypass the signature`, () => {
    const key = platform === "telegram" ? "user" : "vk_user_id";
    for (const value of ["%", "%FF", "%C0%AF", "%00", "%0A"]) {
      const params = new URLSearchParams(sign());
      params.delete(key);
      rejects(() => verify(platform, params + `&${key}=${value}`));
    }
  });
}

for (const user of [
  undefined,
  "null",
  "[]",
  "{}",
  "broken-json",
  '{"id":"42"}',
  '{"id":0}',
  '{"id":-1}',
  '{"id":1.1}',
  '{"id":9007199254740993}',
  '{"id":true}',
]) {
  test(`Telegram: rejects invalid signed user ${user}`, () =>
    rejects(() => verify("telegram", telegram({ user }))));
}

test("Telegram: optional signature and unknown fields are covered by HMAC", () => {
  rejects(() =>
    verify(
      "telegram",
      replace(telegram({ signature: "original" }), "signature", "changed")
    )
  );
  rejects(() => verify("telegram", telegram() + "&unknown=unsigned"));
});

test("Telegram: percent encoding is decoded once and JSON is not reserialized", () => {
  assert.doesNotThrow(() =>
    verify(
      "telegram",
      telegram({ user: '{ "first_name": "%26 & +", "id": 42 }' })
    )
  );
});

test("VK: correct signature for another app is rejected even with shared secret", () => {
  rejects(() => verify("vk", vk({ vk_app_id: "999999" })), "UNEXPECTED_APP");
  rejects(() => verify("vk", replace(vk(), "vk_app_id", "999999")));
});

for (const key of ["vk_user_id", "vk_app_id"]) {
  for (const value of [
    undefined,
    "",
    "0",
    "-42",
    "1.5",
    "1e3",
    "042",
    "42suffix",
  ]) {
    test(`VK: rejects ${key}=${value}`, () =>
      rejects(() => verify("vk", vk({ [key]: value }))));
  }
}

test("VK: unsigned fields cannot supply identity, role or launch time", () => {
  assert.deepEqual(
    verify("vk", vk() + "&role=ADMIN&user_id=42&ts=9999999999"),
    verify("vk", vk())
  );
  rejects(() => verify("vk", vk({ vk_ts: undefined, ts: String(NOW) })));
});

test("VK: all vk_* fields including unknown future fields are signed", () => {
  assert.doesNotThrow(() => verify("vk", vk({ vk_future_field: "new-value" })));
  rejects(() => verify("vk", vk() + "&vk_future_field=unsigned"));
});

test("VK: official VKCOM signature vector passes HMAC then fails expected-app check", () => {
  // Public example: github.com/VKCOM/vk-apps-launch-params/blob/master/examples/node.js
  const raw =
    "vk_user_id=494075&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUH-XEUhC9rBPTJkjUFEkRA";
  rejects(
    () =>
      verifyMiniAppAuth(
        { platform: "vk", rawLaunchData: raw },
        {
          vk: { appId: APP_ID, appSecret: "wvl68m4dR1UpLrVRli" },
        },
        NOW
      ),
    "UNEXPECTED_APP"
  );
  // Old documentation vector lacks vk_ts; it must NOT authenticate successfully.
  rejects(() =>
    verifyMiniAppAuth(
      { platform: "vk", rawLaunchData: raw },
      {
        vk: { appId: "6736218", appSecret: "wvl68m4dR1UpLrVRli" },
      },
      NOW
    )
  );
});

for (const input of [
  null,
  [],
  "telegram",
  {},
  { platform: "other", rawLaunchData: "x" },
  { platform: "telegram", rawLaunchData: {} },
  { platform: "vk", rawLaunchData: "" },
  { platform: "telegram", rawLaunchData: "x", telegramId: 42 },
  { platform: "telegram", rawLaunchData: "x".repeat(16385) },
  { platform: "vk", rawLaunchData: "🦫".repeat(5000) },
]) {
  test(`contract: rejects invalid request ${JSON.stringify(input).slice(0, 90)}`, () => {
    rejects(() => verifyMiniAppAuth(input, config, NOW), "INVALID_REQUEST");
  });
}

test("missing provider configuration fails closed without affecting the other provider", () => {
  rejects(
    () =>
      verifyMiniAppAuth(
        { platform: "telegram", rawLaunchData: telegram() },
        {},
        NOW
      ),
    "AUTH_NOT_CONFIGURED"
  );
  rejects(
    () => verifyMiniAppAuth({ platform: "vk", rawLaunchData: vk() }, {}, NOW),
    "AUTH_NOT_CONFIGURED"
  );
  assert.doesNotThrow(() =>
    verifyMiniAppAuth(
      { platform: "telegram", rawLaunchData: telegram() },
      { telegram: { botToken: BOT_TOKEN } },
      NOW
    )
  );
  assert.doesNotThrow(() =>
    verifyMiniAppAuth(
      { platform: "vk", rawLaunchData: vk() },
      { vk: { appId: APP_ID, appSecret: APP_SECRET } },
      NOW
    )
  );
});

test("Telegram: a signed value cannot inject a new field through LF", () => {
  const raw = telegram({ a: "value\nb=injected" });
  rejects(() => verify("telegram", raw));
});

test("VK: an encoded key cannot inject a different signed query", () => {
  rejects(() => verify("vk", vk({ "vk_extra=1&vk_other": "2" })));
});

test("query decoding uses URLSearchParams, including harmless trailing separators", () => {
  assert.deepEqual(
    verify("telegram", telegram() + "&"),
    verify("telegram", telegram())
  );
  assert.deepEqual(verify("vk", vk() + "&unsigned=%FF"), verify("vk", vk()));
});
