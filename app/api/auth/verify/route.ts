import { MiniAppAuthError } from "@/lib/mini-app-auth/common";
import { authenticateMiniApp } from "@/lib/mini-app-auth/request";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

/** Verification only; a session and database identity are a separate step. */
export async function POST(request: Request) {
  try {
    const identity = authenticateMiniApp(request);
    return Response.json({ identity }, { headers });
  } catch (error) {
    if (!(error instanceof MiniAppAuthError)) {
      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Ошибка авторизации" } },
        { status: 500, headers }
      );
    }

    const unavailable = error.code === "AUTH_NOT_CONFIGURED";
    return Response.json(
      {
        error: {
          code: error.code,
          message: unavailable
            ? "Авторизация платформы не настроена"
            : "Данные запуска недействительны. Откройте приложение заново.",
        },
      },
      { status: unavailable ? 503 : 401, headers }
    );
  }
}
