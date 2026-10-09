import { NextRequest, NextResponse } from "next/server";

import { orderUserSelect } from "@/lib/customer";
import { sendCustomerStatusNotification } from "@/lib/notifications";
import {
  orderId,
  updateOrderSchema,
  sessionHeaders,
  prisma,
  requireRole,
  serializeBigInt,
} from "@/lib";

export const GET = async (request: NextRequest) => {
  try {
    const auth = await requireRole(request, "USER");
    if (auth instanceof NextResponse) return auth;
    const id = orderId(request.nextUrl.searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        ...(auth.user.role !== "ADMIN" && { userId: auth.user.id }),
      },
      include: {
        printJobs: {
          include: {
            files: true,
          },
        },
        user: {
          select: orderUserSelect,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    return NextResponse.json(serializeBigInt(order), {
      headers: sessionHeaders,
    });
  } catch (error) {
    console.error("Ошибка при получении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const authResult = await requireRole(request, "ADMIN");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = orderId(request.nextUrl.searchParams.get("id"));
    const parsed = updateOrderSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Некорректные параметры заказа" },
        { status: 400, headers: sessionHeaders }
      );
    const { status } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: +id },
      select: { status: true, updatedAt: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const updateData = { ...parsed.data };

    const order = await prisma.order.update({
      // Only one competing status transition can update this version.
      where: {
        id: +id,
        ...(status && {
          status: currentOrder.status,
          updatedAt: currentOrder.updatedAt,
        }),
      },
      data: updateData,
      include: {
        printJobs: {
          include: {
            files: true,
          },
        },
        user: {
          select: orderUserSelect,
        },
      },
    });

    if (status && status !== currentOrder.status) {
      await sendCustomerStatusNotification(order);
    }

    return NextResponse.json(serializeBigInt(order), {
      headers: sessionHeaders,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    )
      return NextResponse.json(
        { error: "Заказ уже изменён. Обновите страницу и попробуйте снова." },
        { status: 409, headers: sessionHeaders }
      );
    console.error("Ошибка при обновлении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const auth = await requireRole(request, "ADMIN");
    if (auth instanceof NextResponse) return auth;
    const id = orderId(request.nextUrl.searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id: +id },
    });

    return NextResponse.json({ message: "Заказ удален" });
  } catch (error) {
    console.error("Ошибка при удалении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};
