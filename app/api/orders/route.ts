import { NextRequest, NextResponse } from "next/server";

import { prisma, requireRole } from "@/lib";
import { PaperSize, Urgency } from "@/types";

interface FileInput {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

interface PrintJobInput {
  copies?: number;
  duplex?: boolean;
  isColor?: boolean;
  files: FileInput[];
  paperSize?: PaperSize;
}

interface CreateOrderRequest {
  comment?: string;
  urgency: Urgency;
  telegramId: number;
  deadlineAt?: string;
  printJobs: PrintJobInput[];
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "USER");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const body: CreateOrderRequest = await request.json();
    const { telegramId, printJobs, comment, urgency, deadlineAt } = body;

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID обязателен" },
        { status: 400 }
      );
    }

    if (!printJobs || printJobs.length === 0) {
      return NextResponse.json(
        { error: "Необходимо добавить хотя бы один набор файлов для печати" },
        { status: 400 }
      );
    }

    for (const job of printJobs) {
      if (!job.files || job.files.length === 0) {
        return NextResponse.json(
          { error: "Каждый набор должен содержать хотя бы один файл" },
          { status: 400 }
        );
      }
    }

    if (!urgency || !["ASAP", "SCHEDULED"].includes(urgency)) {
      return NextResponse.json(
        { error: "Некорректное значение срочности заказа" },
        { status: 400 }
      );
    }

    if (urgency === "SCHEDULED" && !deadlineAt) {
      return NextResponse.json(
        { error: "Для запланированного заказа необходимо указать дату" },
        { status: 400 }
      );
    }

    if (urgency === "SCHEDULED" && deadlineAt) {
      const deadline = new Date(deadlineAt);
      if (deadline <= new Date()) {
        return NextResponse.json(
          { error: "Дата выполнения должна быть в будущем" },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.create({
      data: {
        urgency,
        userId: user.id,
        comment: comment || null,
        deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
        printJobs: {
          create: printJobs.map((job) => ({
            copies: job.copies || 1,
            isColor: job.isColor || false,
            paperSize: job.paperSize || "A4Basic",
            duplex: job.duplex || false,
            files: {
              create: job.files.map((file) => ({
                fileUrl: file.fileUrl,
                fileName: file.fileName,
                fileSize: file.fileSize,
                mimeType: file.mimeType || null,
              })),
            },
          })),
        },
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
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
    const status = searchParams.get("status");
    const urgency = searchParams.get("urgency");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status: status as any }),
      ...(urgency && { urgency: urgency as any }),
      ...(telegramId && { telegramId: +telegramId }),
    };

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      skip,
      where,
      take: limit,
      include: {
        printJobs: {
          include: {
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error("Ошибка при получении заказов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
