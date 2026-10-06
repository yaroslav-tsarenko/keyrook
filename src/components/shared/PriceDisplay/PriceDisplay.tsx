"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PRICE_SIZE = {
  sm: "text-[1rem] leading-[1.1]",
  md: "text-step-2 leading-[1.05]",
  lg: "text-step-3 leading-none tracking-[-0.01em] [font-stretch:87.5%]",
};

export function PriceDisplay({ price, comparePrice, size = "md", className }: PriceDisplayProps) {
  const { currency, convert } = useCurrency();
  const dropped = Boolean(comparePrice && comparePrice > price);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span data-price="" className={cn("price text-ink", PRICE_SIZE[size])}>
        {dropped ? <span className="sr-only">Now </span> : null}
        {formatPrice(convert(price), currency)}
      </span>
      {dropped && comparePrice ? (
        <s className="font-mono text-data-sm text-ink-muted">
          <span className="sr-only">Previously </span>
          {formatPrice(convert(comparePrice), currency)}
        </s>
      ) : null}
    </span>
  );
}

export function discountPercent(price: number, comparePrice?: number | null): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.floor(((comparePrice - price) / comparePrice) * 100);
}
