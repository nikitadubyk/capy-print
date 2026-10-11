import type { Order, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";
import { orderUserSelect } from "./customer";
import { getCompletionDiscount, getNewOrderDiscount } from "./order-discounts";

type DiscountOrder = Pick<
  Order,
  "id" | "userId" | "status" | "updatedAt" | "discountPercent"
>;
type CreateOrderData = Omit<
  Prisma.OrderCreateInput,
  "user" | "isFirstOrder" | "discountPercent"
>;
type UpdateOrderData = Pick<
  Order,
  "status" | "comment" | "urgency" | "deadlineAt" | "cancellationReason"
>;

const orderInclude = {
  printJobs: { include: { files: true } },
  user: { select: orderUserSelect },
} as const satisfies Prisma.OrderInclude;

const TRANSACTION_ATTEMPTS = 3;

// Serializable protects both the empty order history and the completed-order counter.
// Deliver notifications only after this function returns: a retry must not send twice.
const withDiscountTransaction = async <T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2034" &&
        attempt < TRANSACTION_ATTEMPTS - 1
      ))
        throw error;
    }
  }
};

const hasOrders = async (
  db: Pick<Prisma.TransactionClient, "order">,
  userId: number
) => !!(await db.order.findFirst({ where: { userId }, select: { id: true } }));

export class CompletedOrderStatusError extends Error {}

export const orderDiscounts = {
  getUserState: async (userId: number) => {
    const [hasExistingOrders, user] = await Promise.all([
      hasOrders(prisma, userId),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { completedOrdersCount: true },
      }),
    ]);
    return {
      isFirstOrder: !hasExistingOrders,
      completedOrdersCount: user.completedOrdersCount,
    };
  },

  createOrder: (userId: number, data: CreateOrderData) =>
    withDiscountTransaction(async (tx) =>
      tx.order.create({
        data: {
          ...data,
          userId,
          ...getNewOrderDiscount(!(await hasOrders(tx, userId))),
        },
        include: orderInclude,
      })
    ),

  updateOrder: (
    currentOrder: DiscountOrder,
    data: Partial<UpdateOrderData>
  ) => {
    if (
      currentOrder.status === "COMPLETED" &&
      data.status &&
      data.status !== "COMPLETED"
    )
      throw new CompletedOrderStatusError(
        "Выполненный заказ нельзя вернуть в работу или отменить."
      );
    const firstCompletion =
      data.status === "COMPLETED" && currentOrder.status !== "COMPLETED";
    return withDiscountTransaction(async (tx) => {
      const user = firstCompletion
        ? await tx.user.findUniqueOrThrow({
            where: { id: currentOrder.userId },
            select: { completedOrdersCount: true },
          })
        : null;
      const order = await tx.order.update({
        where: {
          id: currentOrder.id,
          ...(data.status && {
            status: currentOrder.status,
            updatedAt: currentOrder.updatedAt,
          }),
        },
        data: {
          ...data,
          ...(data.status &&
            data.status !== "CANCELLED" && { cancellationReason: null }),
          ...(user && {
            discountPercent: getCompletionDiscount(
              user.completedOrdersCount,
              currentOrder.discountPercent
            ),
          }),
        },
        include: orderInclude,
      });
      if (!firstCompletion) return { order, firstCompletion };
      const updatedUser = await tx.user.update({
        where: { id: currentOrder.userId },
        data: { completedOrdersCount: { increment: 1 } },
        select: { completedOrdersCount: true },
      });
      return {
        firstCompletion,
        order: {
          ...order,
          user: {
            ...order.user,
            completedOrdersCount: updatedUser.completedOrdersCount,
          },
        },
      };
    });
  },
};
