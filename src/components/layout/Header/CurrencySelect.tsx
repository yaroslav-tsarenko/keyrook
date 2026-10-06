"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency, type Currency } from "@/providers/CurrencyProvider";
import { CURRENCIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

const SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€", GBP: "£" };

export function CurrencySelect({ size = "xs", className, showLabel = false }: { size?: "xs" | "md"; className?: string; showLabel?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const id = useId();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={id} className={showLabel ? "text-step-0 text-ink" : "sr-only"}>
        Currency
      </label>
      <div className="relative">
        <select
          id={id}
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className={cn(
            "cursor-pointer appearance-none border font-mono text-ink transition-colors duration-[120ms]",
            size === "xs" ? "h-8 border-transparent bg-transparent pl-2 pr-6 text-[0.8125rem] text-ink-muted hover-device:hover:border-control hover-device:hover:text-ink" : "h-11 border-control bg-raised pl-3.5 pr-10 text-data shadow-machined-pressed",
          )}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {size === "xs" ? code : `${code} ${SYMBOL[code]}`}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted", size === "xs" ? "right-1.5" : "right-3.5")} />
      </div>
    </div>
  );
}
