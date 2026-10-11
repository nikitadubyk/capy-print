"use client";

import { twMerge } from "tailwind-merge";
import { useCurrentUser } from "@/store/api/users/hooks";
import { FirstOrderBanner } from "./first-order-banner";
import { LoyaltyProgress } from "./loyalty-progress";

export const OrderOffers = ({ className }: { className?: string }) => {
  const { data, isError } = useCurrentUser();
  return data && !isError ? (
    <div className={twMerge("space-y-3", className)}>
      {data.isFirstOrder && <FirstOrderBanner />}
      <LoyaltyProgress completedOrdersCount={data.completedOrdersCount} />
    </div>
  ) : null;
};
