import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: number;
  role: UserRole;
  telegramId: bigint;
  username?: string | null;
  lastName?: string | null;
  firstName?: string | null;
}

export async function getUserByTelegramId(
  telegramId: number,
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        role: true,
        username: true,
        lastName: true,
        firstName: true,
        telegramId: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    return null;
  }
}

export function checkPermission(
  user: AuthUser | null,
  requiredRole: UserRole,
): boolean {
  if (!user) return false;

  if (requiredRole === "ADMIN") {
    return user.role === "ADMIN";
  }

  return true;
}

export async function requireRole(
  request: NextRequest,
  requiredRole: UserRole,
): Promise<{ user: AuthUser } | NextResponse> {
  try {
    const telegramIdHeader = request.headers.get("x-telegram-id");
    const searchParams = request.nextUrl.searchParams;
    const telegramIdQuery = searchParams.get("telegramId");

    const telegramId = telegramIdHeader || telegramIdQuery;

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID обязателен" },
        { status: 401 },
      );
    }

    const user = await getUserByTelegramId(parseInt(telegramId));

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 },
      );
    }

    if (!checkPermission(user, requiredRole)) {
      return NextResponse.json(
        { error: "Недостаточно прав для выполнения этого действия" },
        { status: 403 },
      );
    }

    return { user };
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 });
  }
}

export async function checkOrderAccess(
  user: AuthUser,
  orderId: number,
): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) return false;

    if (user.role === "ADMIN") return true;

    return order.userId === user.id;
  } catch (error) {
    console.error("Ошибка при проверке доступа к заказу:", error);
    return false;
  }
}
