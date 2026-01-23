import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      username,
      last_name,
      first_name,
      isPremium,
      photo_url,
      language_code,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Telegram ID обязателен" },
        { status: 400 },
      );
    }

    const user = await prisma.user.upsert({
      where: { telegramId: id },
      update: {
        photoUrl: photo_url,
        username: username || null,
        lastName: last_name || null,
        firstName: first_name || null,
        isPremium: isPremium || false,
        languageCode: language_code || null,
      },
      create: {
        telegramId: id,
        photoUrl: photo_url,
        username: username || null,
        lastName: last_name || null,
        firstName: first_name || null,
        isPremium: isPremium || false,
        languageCode: language_code || null,
      },
    });

    const userResponse = {
      ...user,
      id: user.id,
      telegramId: user.telegramId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ ...userResponse });
  } catch (error) {
    console.error("Ошибка при сохранении пользователя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID обязателен" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        telegramId: Number(telegramId),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 },
      );
    }

    const userResponse = {
      ...user,
      telegramId: user.telegramId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json(serializeBigInt({ user: userResponse }));
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
