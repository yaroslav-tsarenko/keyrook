"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  layout?: "stack" | "inline";
  className?: string;
  demo?: boolean;
}

const PRICE_SIZE = {
  sm: "text-step-1 leading-[1.1]",
  md: "text-step-2 leading-[1.05]",
  lg: "text-step-3 leading-none tracking-[-0.02em]",
  xl: "text-step-4 leading-none tracking-[-0.02em]",
};

export function discountPercent(price: number, comparePrice?: number | null): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.floor(((comparePrice - price) / comparePrice) * 100);
}

export function DealPlate({ percent, className }: { percent: number; className?: string }) {
  if (percent <= 0) return null;
  return (
    <span data-deal="" className={cn("inline-flex h-[22px] items-center bg-deal px-1.5 font-mono text-[0.75rem] font-semibold leading-none text-on-deal", className)}>
      <span className="sr-only">Price cut </span>−{percent}%
    </span>
  );
}

export function PriceDisplay({ price, comparePrice, size = "md", layout = "stack", className }: PriceDisplayProps) {
  const { currency, convert } = useCurrency();
  const percent = discountPercent(price, comparePrice);
  const was = percent > 0 && comparePrice ? formatPrice(convert(comparePrice), currency) : null;
  const now = (
    <span data-price="" className={cn("price text-ink", PRICE_SIZE[size])}>
      {was ? <span className="sr-only">Now </span> : null}
      {formatPrice(convert(price), currency)}
    </span>
  );

  if (!was) return <span className={cn("inline-flex items-baseline", className)}>{now}</span>;

  if (layout === "inline") {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}>
        {now}
        <DealPlate percent={percent} />
        <s className="font-mono text-[0.8125rem] font-normal text-ink-subtle">
          <span className="sr-only">Was </span>
          {was}
        </s>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <s className="font-mono text-[0.8125rem] font-normal leading-none text-ink-subtle">
        <span className="sr-only">Was </span>
        {was}
      </s>
      <span className="inline-flex items-center gap-2">
        {now}
        <DealPlate percent={percent} />
      </span>
    </span>
  );
}
