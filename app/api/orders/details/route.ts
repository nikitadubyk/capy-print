import { NextRequest, NextResponse } from "next/server";

import { OrderStatus } from "@/app/generated/prisma/enums";
import {
  orderId,
  updateOrderSchema,
  sessionHeaders,
  prisma,
  requireRole,
  sendTelegramMessage,
  serializeBigInt,
} from "@/lib";

export async function GET(request: NextRequest) {
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
          select: {
            id: true,
            username: true,
            lastName: true,
            firstName: true,
            telegramId: true,
          },
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
}

export async function PATCH(request: NextRequest) {
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
      include: {
        user: {
          select: {
            telegramId: true,
            firstName: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const updateData = { ...parsed.data };

    const order = await prisma.order.update({
      where: { id: +id },
      data: updateData,
      include: {
        printJobs: {
          include: {
            files: true,
          },
        },
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (status && status !== currentOrder.status) {
      const statusMessages = {
        [OrderStatus.CANCELLED]: `❌ <b>Ваш заказ #${id} отменен</b>\n\n`,
        [OrderStatus.COMPLETED]: `✅ <b>Ваш заказ #${id} готов!</b>\n\nМожете забрать его по адресу: Изотова 7 (Центральный рынок).`,
        PRINTING: `🖨️ <b>Ваш заказ #${id} принят в работу!</b>\n\nМы начали печатать ваши документы. Как только заказ будет готов, вы получите уведомление.`,
      };

      const message = statusMessages[status as keyof typeof statusMessages];

      if (message && order.user.telegramId) {
        await sendTelegramMessage({
          text: message,
          chatId: Number(order.user.telegramId),
        });
      }
    }

    return NextResponse.json(serializeBigInt(order), {
      headers: sessionHeaders,
    });
  } catch (error) {
    console.error("Ошибка при обновлении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
}
