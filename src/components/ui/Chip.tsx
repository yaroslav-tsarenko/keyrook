"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FilterChip({ label, onRemove, className }: { label: string; onRemove: () => void; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-control border border-control bg-raised pl-3 text-ui-sm font-semibold text-ink transition-colors duration-[140ms]",
        "has-[button:hover]:border-ink",
        className,
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-ink-muted hover-device:hover:text-ink"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </span>
  );
}

export function FilterChipRow({ children, onClearAll, className }: { children: ReactNode; onClearAll?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {onClearAll ? (
        <button type="button" onClick={onClearAll} className="ml-1 min-h-8 cursor-pointer text-ui-sm font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
          Clear all
        </button>
      ) : null}
    </div>
  );
}
