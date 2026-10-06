"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FilterChip({ label, onRemove, platform, className }: { label: string; onRemove: () => void; platform?: string | null; className?: string }) {
  return (
    <span
      data-platform={platform ?? undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 border border-control bg-raised pl-3 text-ui-sm font-[560] text-ink transition-colors duration-[120ms]",
        "has-[button:hover]:border-ink",
        className,
      )}
    >
      {platform ? <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" /> : null}
      <span className="whitespace-nowrap">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:text-ink"
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
        <button type="button" onClick={onClearAll} className="btn-text ml-2 min-h-8 cursor-pointer text-ui-sm font-[560] text-ink">
          <span data-label="">Clear all</span>
        </button>
      ) : null}
    </div>
  );
}
