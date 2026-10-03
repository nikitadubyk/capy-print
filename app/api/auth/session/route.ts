import { MiniAppAuthError } from "@/lib/mini-app-auth/common";
import { authenticateMiniApp } from "@/lib/mini-app-auth/request";
import {
  prisma,
  getSession,
  hashSessionToken,
  issueSession,
  readSessionToken,
  sessionHeaders,
  sessionUserDto,
} from "@/lib";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const identity = authenticateMiniApp(request);
    const rawLaunchData = request.headers
      .get("authorization")!
      .replace(/^\S+ +/, "");
    return Response.json(await issueSession(identity, rawLaunchData), {
      headers: sessionHeaders,
    });
  } catch (error) {
    const known = error instanceof MiniAppAuthError;
    const unavailable = known && error.code === "AUTH_NOT_CONFIGURED";
    return Response.json(
      {
        error: {
          code: known ? error.code : "INTERNAL_ERROR",
          message: unavailable
            ? "Авторизация платформы не настроена"
            : known
              ? "Данные запуска недействительны. Откройте приложение заново."
              : "Не удалось создать сессию. Попробуйте ещё раз.",
        },
      },
      {
        status: unavailable ? 503 : known ? 401 : 500,
        headers: sessionHeaders,
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session)
      return Response.json(
        { error: "Сессия недействительна. Откройте приложение заново." },
        { status: 401, headers: sessionHeaders }
      );
    return Response.json(
      {
        user: sessionUserDto(session.identity.user),
        platform: session.identity.provider === "TELEGRAM" ? "telegram" : "vk",
      },
      { headers: sessionHeaders }
    );
  } catch {
    return Response.json(
      { error: "Ошибка авторизации" },
      { status: 500, headers: sessionHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  const token = readSessionToken(request);
  if (!token)
    return Response.json(
      { error: "Сессия обязательна" },
      { status: 401, headers: sessionHeaders }
    );
  try {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
    return new Response(null, { status: 204, headers: sessionHeaders });
  } catch {
    return Response.json(
      { error: "Не удалось завершить сессию" },
      { status: 500, headers: sessionHeaders }
    );
  }
}
