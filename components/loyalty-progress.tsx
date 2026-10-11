import { Percent } from "lucide-react";
import { Text } from "@mantine/core";
import { twMerge } from "tailwind-merge";
import {
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_ORDER_INTERVAL,
} from "@/config/loyalty";
import {
  getLoyaltyProgress,
  getLoyaltyProgressText,
} from "@/lib/order-discounts";

export const LoyaltyProgress = ({
  completedOrdersCount,
  className,
}: {
  completedOrdersCount: number;
  className?: string;
}) => {
  const { filled } = getLoyaltyProgress(completedOrdersCount);
  return (
    <aside
      aria-label="Бонус за выполненные заказы"
      className={twMerge(
        "rounded-2xl border border-capy-accent/20 bg-capy-accent/10 p-4 text-capy-ink",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Percent
          size={24}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-capy-accent"
        />
        <div className="min-w-0">
          <Text fw={600}>
            Скидка {LOYALTY_DISCOUNT_PERCENT}% на каждый третий выполненный
            заказ
          </Text>
          <Text size="sm" className="mt-1" lh={1.625}>
            {getLoyaltyProgressText(completedOrdersCount)}
          </Text>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Выполненные заказы в текущем бонусном цикле"
        aria-valuemin={0}
        aria-valuemax={LOYALTY_ORDER_INTERVAL}
        aria-valuenow={filled}
        aria-valuetext={`${filled} из ${LOYALTY_ORDER_INTERVAL}`}
        className="mt-4 flex gap-2"
      >
        {Array.from({ length: LOYALTY_ORDER_INTERVAL }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={twMerge(
              "h-3 flex-1 rounded-md border border-capy-accent/30 bg-white",
              index < filled && "border-capy-accent bg-capy-accent"
            )}
          />
        ))}
      </div>
      <Text size="sm" className="mt-2">
        Учитываются только выполненные заказы.
      </Text>
    </aside>
  );
};
