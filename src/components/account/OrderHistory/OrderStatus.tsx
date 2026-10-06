"use client";

import { useTranslations } from "next-intl";
import { StatusPlate } from "@/components/ui/Plate";
import { plateStatusFor, type CustomerOrderState } from "@/lib/orders";

export function OrderStatus({ state, className }: { state: CustomerOrderState; className?: string }) {
  const t = useTranslations("account.states");
  return <StatusPlate status={plateStatusFor(state)} label={t(state)} className={className} />;
}
