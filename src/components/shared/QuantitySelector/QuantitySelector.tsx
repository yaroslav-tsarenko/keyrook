"use client";

import { useEffect, useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onChange: (quantity: number) => void;
  size?: "md" | "compact";
  showStockHint?: boolean;
  label?: string;
  className?: string;
}

export function QuantitySelector({
  quantity,
  maxQuantity,
  onChange,
  size = "md",
  showStockHint = true,
  label = "Quantity",
  className,
}: QuantitySelectorProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(quantity));
  const [announcement, setAnnouncement] = useState("");
  const max = Math.max(1, maxQuantity);

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(max, Math.max(1, parsed)) : quantity;
    setDraft(String(clamped));
    if (Number.isFinite(parsed) && clamped !== parsed) {
      setAnnouncement(`Quantity set to ${clamped}${clamped === max ? `, only ${max} available` : ""}`);
    }
    if (clamped !== quantity) onChange(clamped);
  };

  const compact = size === "compact";
  const segment = cn(
    "flex shrink-0 cursor-pointer items-center justify-center text-ink transition-colors duration-[140ms]",
    "hover-device:enabled:hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-ink-subtle disabled:opacity-60",
    compact ? "size-9" : "size-10",
  );

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <div role="group" aria-labelledby={`${id}-label`} className="inline-flex w-fit overflow-hidden rounded-control border border-control bg-raised">
        <span id={`${id}-label`} className="sr-only">
          {label}
        </span>
        <button type="button" className={segment} onClick={() => onChange(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          className={cn(
            "w-11 border-x border-control bg-transparent text-center font-mono text-data text-ink focus-visible:outline-offset-[-2px]",
            compact ? "h-9" : "h-10",
          )}
        />
        <button type="button" className={segment} onClick={() => onChange(Math.min(max, quantity + 1))} disabled={quantity >= max} aria-label="Increase quantity">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      {showStockHint && quantity >= max ? <p className="font-mono text-data-sm text-ink-muted">{max} available</p> : null}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
