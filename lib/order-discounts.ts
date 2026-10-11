import {
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_ORDER_INTERVAL,
} from "@/config/loyalty";
import { FIRST_ORDER_DISCOUNT_PERCENT } from "@/config/first-order";

export const getNewOrderDiscount = (isFirstOrder: boolean) => ({
  isFirstOrder,
  discountPercent: isFirstOrder ? FIRST_ORDER_DISCOUNT_PERCENT : 0,
});

export const getLoyaltyProgress = (completedOrdersCount: number) => ({
  filled: completedOrdersCount % LOYALTY_ORDER_INTERVAL,
  remaining:
    LOYALTY_ORDER_INTERVAL - (completedOrdersCount % LOYALTY_ORDER_INTERVAL),
});

export const getLoyaltyProgressText = (completedOrdersCount: number) => {
  const { remaining } = getLoyaltyProgress(completedOrdersCount);
  return remaining === 1
    ? `Следующий выполненный заказ получит скидку ${LOYALTY_DISCOUNT_PERCENT}%.`
    : `Ещё ${remaining} выполненных заказа до скидки ${LOYALTY_DISCOUNT_PERCENT}%.`;
};

export const getCompletionDiscount = (
  completedOrdersCount: number,
  currentDiscountPercent: number
) =>
  (completedOrdersCount + 1) % LOYALTY_ORDER_INTERVAL === 0
    ? Math.max(currentDiscountPercent, LOYALTY_DISCOUNT_PERCENT)
    : currentDiscountPercent;
