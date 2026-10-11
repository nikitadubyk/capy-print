import { Percent } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  FIRST_ORDER_DISCOUNT_PERCENT,
  getFirstOrderStaffReminder,
} from "@/config/first-order";

interface FirstOrderBannerProps {
  isAdmin?: boolean;
  className?: string;
  discountPercent?: number;
}

export const FirstOrderBanner = ({
  isAdmin = false,
  className = "",
  discountPercent = FIRST_ORDER_DISCOUNT_PERCENT,
}: FirstOrderBannerProps) => (
  <aside
    aria-label="Скидка на первый заказ"
    className={twMerge(
      "flex items-start gap-3 rounded-2xl border border-capy-accent/20 bg-capy-accent/10 p-4 text-capy-ink",
      className
    )}
  >
    <Percent
      size={24}
      className="mt-0.5 shrink-0 text-capy-accent"
      aria-hidden="true"
    />
    <div className="min-w-0">
      <p className="font-semibold">
        {isAdmin
          ? "Первый заказ клиента"
          : `Скидка ${discountPercent}% на первый заказ`}
      </p>
      <p className="mt-1 text-sm leading-relaxed">
        {isAdmin
          ? getFirstOrderStaffReminder(discountPercent)
          : `На первый заказ будет скидка ${discountPercent}% от стоимости. Сотрудник учтёт её при оплате в копицентре.`}
      </p>
    </div>
  </aside>
);
