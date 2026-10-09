import { NextResponse } from "next/server";
import { requireRole, sessionHeaders, sessionUserDto } from "@/lib";
import { getSession, prisma, sessionUserSelect } from "@/lib";
import { z } from "zod";

const vkProfileSchema = z
  .object({
    id: z.number().int().positive().refine(Number.isSafeInteger),
    first_name: z.string().trim().min(1).max(256),
    last_name: z.string().trim().max(256),
    photo_200: z
      .url()
      .max(2048)
      .refine((url) => new URL(url).protocol === "https:")
      .optional(),
  })
  .strict();

export const PATCH = async (request: Request) => {
  try {
    const session = await getSession(request);
    if (!session)
      return NextResponse.json(
        { error: "Сессия недействительна" },
        { status: 401, headers: sessionHeaders }
      );
    if (session.identity.provider !== "VK")
      return NextResponse.json(
        { error: "Профиль доступен только для сессии ВКонтакте" },
        { status: 403, headers: sessionHeaders }
      );
    const parsed = vkProfileSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Некорректные данные профиля" },
        { status: 400, headers: sessionHeaders }
      );
    if (String(parsed.data.id) !== session.identity.externalUserId)
      return NextResponse.json(
        { error: "Профиль не соответствует текущему пользователю" },
        { status: 403, headers: sessionHeaders }
      );
    const profile = parsed.data;
    // Names/photos are display metadata. Ownership, platform and role stay server-controlled.
    const user = await prisma.user.update({
      where: { id: session.identity.user.id },
      data: {
        firstName: profile.first_name,
        lastName: profile.last_name || null,
        ...(profile.photo_200 && { photoUrl: profile.photo_200 }),
      },
      select: sessionUserSelect,
    });
    return NextResponse.json(
      { user: sessionUserDto(user) },
      { headers: sessionHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить профиль" },
      { status: 500, headers: sessionHeaders }
    );
  }
};

export const GET = async (request: Request) => {
  const result = await requireRole(request, "USER");
  if (result instanceof NextResponse) return result;
  return NextResponse.json(
    { user: sessionUserDto(result.user) },
    { headers: sessionHeaders }
  );
};
