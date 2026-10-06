"use client";

import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import type { Totals } from "@/lib/pricing";

interface TotalsListProps {
  totals: Totals;
  currency: string;
  showCurrencyCode?: boolean;
  totalSize?: "md" | "lg";
  className?: string;
}

export function TotalsList({ totals, currency, showCurrencyCode = false, totalSize = "lg", className }: TotalsListProps) {
  const t = useTranslations("checkout.totals");
  const money = (amount: number) => formatPrice(amount, currency);
  const row = "flex items-baseline justify-between gap-4";
  const totalLabel = totals.vatRegistered && totals.vatIncluded ? t("totalInclVat") : t("total");
  return (
    <dl className={cn("m-0 flex flex-col gap-2.5", className)}>
      <div className={row}>
        <dt className="text-ui-md text-ink-muted">{t("subtotal")}</dt>
        <dd className="m-0 font-mono text-data text-ink">{money(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 ? (
        <div className={row}>
          <dt className="text-ui-md text-ink-muted">{t("discount", { percent: totals.discountPercent })}</dt>
          <dd className="m-0 font-mono text-data text-ink">−{money(totals.discount)}</dd>
        </div>
      ) : null}
      {totals.shipping > 0 ? (
        <div className={row}>
          <dt className="text-ui-md text-ink-muted">{t("delivery")}</dt>
          <dd className="m-0 font-mono text-data text-ink">{money(totals.shipping)}</dd>
        </div>
      ) : null}
      {totals.vatRegistered && !totals.vatIncluded ? (
        <div className={row}>
          <dt className="text-ui-md text-ink-muted">{t("vat", { rate: totals.vatRatePercent })}</dt>
          <dd className="m-0 font-mono text-data text-ink">{money(totals.vat)}</dd>
        </div>
      ) : null}
      <div className={cn(row, "mt-1 border-t border-line pt-3")}>
        <dt className="text-step-0 font-[560] text-ink">
          {totalLabel}
          {showCurrencyCode ? <span className="text-ink-muted"> ({currency})</span> : null}
        </dt>
        <dd className={cn("price m-0 leading-none text-ink", totalSize === "lg" ? "text-step-2" : "text-step-1")}>{money(totals.total)}</dd>
      </div>
      {totals.vatRegistered && totals.vatIncluded ? (
        <div className={row}>
          <dt className="text-ui-sm text-ink-muted">{t("vatIncluded", { rate: totals.vatRatePercent })}</dt>
          <dd className="m-0 font-mono text-[0.75rem] text-ink-muted">{money(totals.vat)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
