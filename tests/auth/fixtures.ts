import { createHmac } from "node:crypto";

// Synthetic credentials only. No environment, database or external APIs needed.
export const NOW = 1_800_000_000;
export const BOT_TOKEN = "123456:test-only-bot-token";
export const APP_ID = "123456";
export const APP_SECRET = "test-only-vk-app-secret";
export const config = {
  telegram: { botToken: BOT_TOKEN },
  vk: { appId: APP_ID, appSecret: APP_SECRET },
};

export function telegram(
  overrides: Record<string, string | undefined> = {},
  token = BOT_TOKEN
) {
  const fields: Record<string, string | undefined> = {
    user: '{"id":4503599627370495,"first_name":"Капи + & = % 🦫"}',
    auth_date: String(NOW),
    query_id: "test-query",
    ...overrides,
  };
  const pairs = Object.entries(fields).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  const payload = pairs
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const key = createHmac("sha256", "WebAppData").update(token).digest();
  return new URLSearchParams([
    ...pairs,
    ["hash", createHmac("sha256", key).update(payload).digest("hex")],
  ]).toString();
}

export function vk(
  overrides: Record<string, string | undefined> = {},
  secret = APP_SECRET
) {
  const fields: Record<string, string | undefined> = {
    vk_user_id: "9007199254740993",
    vk_app_id: APP_ID,
    vk_ts: String(NOW),
    vk_access_token_settings: "",
    vk_language: "ru",
    ...overrides,
  };
  const pairs = Object.entries(fields).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  const payload = pairs
    .filter(([key]) => key.startsWith("vk_"))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  return new URLSearchParams([
    ...pairs,
    ["sign", createHmac("sha256", secret).update(payload).digest("base64url")],
  ]).toString();
}

export function replace(raw: string, key: string, value: string) {
  const params = new URLSearchParams(raw);
  params.set(key, value);
  return params.toString();
}
