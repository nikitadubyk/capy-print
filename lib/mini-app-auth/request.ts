import { MiniAppAuthError } from "@/lib/mini-app-auth/common";
import { verifyMiniAppAuth } from "@/lib/mini-app-auth/verify";

/** Used by a session endpoint or route guard; never reads business data. */
export function authenticateMiniApp(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^(telegram|vk) +([^\s]+)$/i.exec(authorization);
  if (!match) throw new MiniAppAuthError("INVALID_REQUEST");

  return verifyMiniAppAuth(
    {
      platform: match[1].toLowerCase(),
      rawLaunchData: match[2],
    },
    {
      telegram: { botToken: process.env.TELEGRAM_BOT_TOKEN ?? "" },
      vk: {
        appId: process.env.VK_APP_ID ?? "",
        appSecret: process.env.VK_APP_SECRET ?? "",
      },
    }
  );
}
