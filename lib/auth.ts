import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionHeaders } from "@/lib/session";

export type UserRole = "USER" | "ADMIN";
export interface AuthUser {
  id: number;
  role: UserRole;
  telegramId: bigint | null;
  username: string | null;
  lastName: string | null;
  firstName: string | null;
}

export function checkPermission(
  user: AuthUser | null,
  requiredRole: UserRole
): boolean {
  return !!user && (requiredRole !== "ADMIN" || user.role === "ADMIN");
}

export async function requireRole(
  request: Request,
  requiredRole: UserRole
): Promise<{ user: AuthUser } | NextResponse> {
  try {
    const session = await getSession(request);
    if (!session)
      return NextResponse.json(
        { error: "Сессия недействительна. Откройте приложение заново." },
        { status: 401, headers: sessionHeaders }
      );
    const user = session.identity.user;
    // The current role always comes from the database, never from token claims or launch data.
    if (!checkPermission(user, requiredRole))
      return NextResponse.json(
        { error: "Недостаточно прав для выполнения этого действия" },
        { status: 403, headers: sessionHeaders }
      );
    return { user };
  } catch {
    return NextResponse.json(
      { error: "Ошибка авторизации" },
      { status: 500, headers: sessionHeaders }
    );
  }
}

export async function checkOrderAccess(
  user: AuthUser,
  orderId: number
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });
  return !!order && (user.role === "ADMIN" || order.userId === user.id);
}
