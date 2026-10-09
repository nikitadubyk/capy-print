import { NextResponse } from "next/server";
import { getSession, sessionHeaders } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getVkMessagingConfig, isVkMessagesAllowed } from "@/lib/vk";
import type { VkMessagesPermission } from "@/types/vk-messages";

export const GET = async (request: Request) => {
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
    return NextResponse.json(data, { headers: sessionHeaders });
  } catch {
    return NextResponse.json(
      { error: "Не удалось проверить разрешение на сообщения" },
      { status: 502, headers: sessionHeaders }
    );
  }
};

const preferenceSchema = z.object({ enabled: z.boolean() }).strict();

export const POST = async (request: Request) => {
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
    const config = getVkMessagingConfig();
    const { enabled } = parsed.data;
    if (enabled && !config)
      return NextResponse.json(
        { error: "Сообщения сообщества пока не настроены" },
        { status: 503, headers: sessionHeaders }
      );
    if (
      enabled &&
      !(await isVkMessagesAllowed(session.identity.externalUserId))
    )
      return NextResponse.json(
        { error: "Разрешение на сообщения не подтверждено VK" },
        { status: 403, headers: sessionHeaders }
      );
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
    return NextResponse.json(data, { headers: sessionHeaders });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить выбор сообщений" },
      { status: 502, headers: sessionHeaders }
    );
  }
};
