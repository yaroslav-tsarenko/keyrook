"use client";

import { useEffect, useId, useState } from "react";
import { SquareMinus, SquarePlus } from "lucide-react";
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
      setAnnouncement(`Quantity set to ${clamped}${clamped === max ? `, up to ${max} per order` : ""}`);
    }
    if (clamped !== quantity) onChange(clamped);
  };

  const compact = size === "compact";
  const segment = cn(
    "flex shrink-0 cursor-pointer items-center justify-center text-ink transition-colors duration-[120ms]",
    "hover-device:enabled:hover:bg-raised active:shadow-machined-pressed disabled:cursor-not-allowed disabled:text-ink-subtle",
    compact ? "size-9 touch-device:size-11" : "size-10 touch-device:size-11",
  );

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <div role="group" aria-labelledby={`${id}-label`} className="inline-flex w-fit overflow-hidden border border-control bg-plate shadow-machined">
        <span id={`${id}-label`} className="sr-only">
          {label}
        </span>
        <button type="button" className={segment} onClick={() => onChange(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
          <SquareMinus size={18} aria-hidden="true" />
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
            "w-11 border-x border-control bg-surface-2 text-center font-mono text-data text-ink shadow-machined-pressed focus-visible:outline-offset-[-2px]",
            compact ? "h-9 touch-device:h-11" : "h-10 touch-device:h-11",
          )}
        />
        <button type="button" className={segment} onClick={() => onChange(Math.min(max, quantity + 1))} disabled={quantity >= max} aria-label="Increase quantity">
          <SquarePlus size={18} aria-hidden="true" />
        </button>
      </div>
      {showStockHint && quantity >= max ? <p className="m-0 text-ui-sm text-ink-muted">Up to {max} per order</p> : null}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
