import { NextRequest, NextResponse } from "next/server";

import { prisma, requireRole } from "@/lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(request, "ADMIN");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: +id },
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Ошибка при получении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(request, "ADMIN");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, comment, urgency, deadlineAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) updateData.status = status;
    if (comment !== undefined) updateData.comment = comment;
    if (urgency) updateData.urgency = urgency;
    if (deadlineAt !== undefined) {
      updateData.deadlineAt = deadlineAt ? new Date(deadlineAt) : null;
    }

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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Ошибка при обновлении заказа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

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
