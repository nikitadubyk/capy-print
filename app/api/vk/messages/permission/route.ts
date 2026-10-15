import { NextResponse } from "next/server";
import { getSession, sessionHeaders } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  getVkMessagingConfig,
  isVkMessagesAllowed,
  VkMessagingError,
} from "@/lib/vk";
import {
  getVkMessagingErrorDiagnostics,
  logVkMessaging,
} from "@/lib/vk-diagnostics";
import type { VkMessagesPermission } from "@/types/vk-messages";

export const GET = async (request: Request) => {
  let context: { userId?: number; externalUserId?: string } = {};
  let stage = "session";
  try {
    const session = await getSession(request);
    if (!session)
      return NextResponse.json(
        { error: "Сессия недействительна" },
        { status: 401, headers: sessionHeaders }
      );
    if (session.identity.provider !== "VK")
      return NextResponse.json(
        { error: "Разрешение доступно только во ВКонтакте" },
        { status: 403, headers: sessionHeaders }
      );
    context = {
      userId: session.identity.user.id,
      externalUserId: session.identity.externalUserId,
    };
    stage = "permission_check";
    const config = getVkMessagingConfig();
    const enabled = session.identity.vkMessagesEnabled ?? null;
    const data: VkMessagesPermission = config
      ? {
          configured: true,
          groupId: config.groupId,
          allowed:
            enabled == null
              ? await isVkMessagesAllowed(session.identity.externalUserId)
              : null,
          enabled,
        }
      : { configured: false, groupId: null, allowed: null, enabled };
    logVkMessaging(config ? "info" : "error", "permission.loaded", {
      ...context,
      stage,
      vkMessagesEnabled: enabled,
      allowed: data.allowed,
      ...(!config &&
        getVkMessagingErrorDiagnostics(new VkMessagingError("config"))),
    });
    return NextResponse.json(data, { headers: sessionHeaders });
  } catch (error) {
    logVkMessaging("error", "permission.load_failed", {
      ...context,
      stage,
      ...getVkMessagingErrorDiagnostics(error),
    });
    return NextResponse.json(
      { error: "Не удалось проверить разрешение на сообщения" },
      { status: 502, headers: sessionHeaders }
    );
  }
};

const preferenceSchema = z.object({ enabled: z.boolean() }).strict();

export const POST = async (request: Request) => {
  let context: {
    userId?: number;
    externalUserId?: string;
    vkMessagesEnabled?: boolean | null;
    requestedEnabled?: boolean;
  } = {};
  let stage = "session";
  try {
    const session = await getSession(request);
    if (!session)
      return NextResponse.json(
        { error: "Сессия недействительна" },
        { status: 401, headers: sessionHeaders }
      );
    if (session.identity.provider !== "VK")
      return NextResponse.json(
        { error: "Разрешение доступно только во ВКонтакте" },
        { status: 403, headers: sessionHeaders }
      );
    const parsed = preferenceSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Некорректный выбор сообщений" },
        { status: 400, headers: sessionHeaders }
      );
    context = {
      userId: session.identity.user.id,
      externalUserId: session.identity.externalUserId,
      vkMessagesEnabled: session.identity.vkMessagesEnabled ?? null,
    };
    const config = getVkMessagingConfig();
    const { enabled } = parsed.data;
    context.requestedEnabled = enabled;
    stage = "permission_check";
    if (enabled && !config) {
      logVkMessaging("error", "permission.unconfigured", {
        ...context,
        stage,
        ...getVkMessagingErrorDiagnostics(new VkMessagingError("config")),
      });
      return NextResponse.json(
        { error: "Сообщения сообщества пока не настроены" },
        { status: 503, headers: sessionHeaders }
      );
    }
    if (
      enabled &&
      !(await isVkMessagesAllowed(session.identity.externalUserId))
    ) {
      logVkMessaging("warn", "permission.denied", {
        ...context,
        stage,
        allowed: false,
        reason: "VK не подтвердил разрешение; согласие не сохранено",
      });
      return NextResponse.json(
        { error: "Разрешение на сообщения не подтверждено VK" },
        { status: 403, headers: sessionHeaders }
      );
    }
    stage = "preference_save";
    await prisma.userIdentity.update({
      where: { id: session.identity.id },
      data: { vkMessagesEnabled: enabled },
    });
    const data: VkMessagesPermission = {
      configured: !!config,
      groupId: config?.groupId ?? null,
      allowed: enabled,
      enabled,
    };
    logVkMessaging("info", "permission.saved", {
      ...context,
      stage,
      vkMessagesEnabled: enabled,
      allowed: enabled ? true : null,
    });
    return NextResponse.json(data, { headers: sessionHeaders });
  } catch (error) {
    logVkMessaging("error", "permission.save_failed", {
      ...context,
      stage,
      ...getVkMessagingErrorDiagnostics(error),
    });
    return NextResponse.json(
      { error: "Не удалось сохранить выбор сообщений" },
      { status: 502, headers: sessionHeaders }
    );
  }
};
