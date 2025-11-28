import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      lastName,
      firstName,
      isPremium,
      telegramId,
      languageCode,
    } = body;

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID обязателен" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: {
        telegramId: BigInt(telegramId),
      },
      update: {
        username: username || null,
        lastName: lastName || null,
        firstName: firstName || null,
        isPremium: isPremium || false,
        languageCode: languageCode || null,
      },
      create: {
        username: username || null,
        lastName: lastName || null,
        firstName: firstName || null,
        isPremium: isPremium || false,
        telegramId: BigInt(telegramId),
        languageCode: languageCode || null,
      },
    });

    const userResponse = {
      ...user,
      id: user.id,
      telegramId: user.telegramId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Ошибка при сохранении пользователя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        telegramId: BigInt(telegramId),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const userResponse = {
      ...user,
      telegramId: user.telegramId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
