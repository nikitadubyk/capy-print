import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@/app/generated/prisma/client";
import { Order, PaperSize, Urgency } from "@/types";
import { orderUserSelect } from "@/lib/customer";
import { getErrorDiagnostics } from "@/lib/error-diagnostics";
import {
  createOrderSchema,
  listOrdersSchema,
  sessionHeaders,
  prisma,
  requireRole,
  serializeBigInt,
  sendOrderNotification,
} from "@/lib";

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
  paperSize?: string;
}

export interface CreateOrderRequest {
  comment?: string;
  urgency: Urgency;
  deadlineAt?: string;
  printJobs: PrintJobInput[];
}

export const POST = async (request: NextRequest) => {
  try {
    const authResult = await requireRole(request, "USER");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const parsed = createOrderSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Некорректные параметры заказа" },
        { status: 400, headers: sessionHeaders }
      );
    const { printJobs, comment, urgency, deadlineAt } = parsed.data;

    const order = await prisma.order.create({
      data: {
        urgency,
        userId: user.id,
        comment: comment || null,
        deadlineAt: deadlineAt || null,
        printJobs: {
          create: printJobs.map((job) => ({
            copies: job.copies || 1,
            isColor: job.isColor || false,
            paperSize: job.paperSize || PaperSize.A4Basic,
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
          select: orderUserSelect,
        },
      },
    });

    console.info("[Capy Print][order] Заказ сохранён", { orderId: order.id });
    await sendOrderNotification(order as Order);

    return NextResponse.json(serializeBigInt(order), {
      status: 201,
      headers: sessionHeaders,
    });
  } catch (error) {
    console.error(
      "[Capy Print][order] Ошибка создания заказа на сервере",
      getErrorDiagnostics(error)
    );
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const auth = await requireRole(request, "USER");
    if (auth instanceof NextResponse) return auth;
    const searchParams = request.nextUrl.searchParams;
    const parsed = listOrdersSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Некорректные параметры списка" },
        { status: 400, headers: sessionHeaders }
      );
    const { page, limit, status, urgency, scope } = parsed.data;
    if (scope === "all" && auth.user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403, headers: sessionHeaders }
      );
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      ...(scope === "mine" && { userId: auth.user.id }),
      ...(status && { status }),
      ...(urgency && { urgency }),
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
        user: {
          select: orderUserSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      serializeBigInt({
        page,
        limit,
        total,
        orders,
        totalPages: Math.ceil(total / limit),
      }),
      { headers: sessionHeaders }
    );
  } catch (error) {
    console.error("Ошибка при получении заказов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};
