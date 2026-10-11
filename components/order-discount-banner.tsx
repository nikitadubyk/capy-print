import { Percent } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { FirstOrderBanner } from "./first-order-banner";

export const OrderDiscountBanner = ({
  discountPercent,
  isFirstOrder,
  isAdmin = false,
  className,
}: {
  discountPercent: number;
  isFirstOrder: boolean;
  isAdmin?: boolean;
  className?: string;
}) =>
  isFirstOrder && discountPercent > 0 ? (
    <FirstOrderBanner
      discountPercent={discountPercent}
      isAdmin={isAdmin}
      className={className}
    />
  ) : discountPercent > 0 ? (
    <aside
      aria-label="Скидка на заказ"
      className={twMerge(
        "flex items-start gap-3 rounded-2xl border border-capy-accent/20 bg-capy-accent/10 p-4 text-capy-ink",
        className
      )}
    >
      <Percent
        size={24}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-capy-accent"
      />
      <div className="min-w-0">
        <p className="font-semibold">
          Бонус за каждый третий выполненный заказ
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          {isAdmin
            ? `Обязательно примените скидку ${discountPercent}% от стоимости заказа при оплате.`
            : `К этому заказу будет применена скидка ${discountPercent}% от стоимости при оплате в копицентре.`}
        </p>
      </div>
    </aside>
  ) : null;
