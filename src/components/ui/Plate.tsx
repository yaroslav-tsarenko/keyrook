import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PlateVariant = "outline" | "neutral" | "success" | "warning" | "danger" | "info" | "indicator" | "platform" | "region" | "type" | "edition" | "deal" | "count";

const ENGRAVED = "font-display font-semibold uppercase tracking-[0.1em] [font-stretch:125%] text-shadow-engrave";
const MONO = "font-mono font-medium uppercase tracking-[0.04em]";

const VARIANT: Record<PlateVariant, string> = {
  outline: cn(ENGRAVED, "border border-line text-ink"),
  platform: cn(ENGRAVED, "border border-line text-ink"),
  region: cn(MONO, "px-0 text-ink"),
  type: cn(ENGRAVED, "border border-line text-type"),
  edition: cn(ENGRAVED, "bg-surface-1 text-ink"),
  neutral: cn(ENGRAVED, "bg-surface-1 text-ink"),
  success: cn(ENGRAVED, "bg-success-tint text-success"),
  warning: cn(ENGRAVED, "bg-warning-tint text-warning"),
  danger: cn(ENGRAVED, "bg-danger-tint text-danger"),
  info: cn(ENGRAVED, "bg-info-tint text-info"),
  indicator: cn(MONO, "bg-brand text-on-brand"),
  count: cn(MONO, "bg-brand text-on-brand"),
  deal: cn("font-mono font-semibold tracking-[-0.01em] bg-deal text-on-deal px-1.5"),
};

const DOT: Partial<Record<PlateVariant, string>> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export interface PlateProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PlateVariant;
  size?: "sm" | "md";
  children: ReactNode;
}

export function Plate({ variant = "neutral", size = "md", className, children, ...rest }: PlateProps) {
  const dot = DOT[variant];
  return (
    <span
      data-plate={variant}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap leading-none",
        size === "sm" ? "h-5 px-1.5 text-[0.75rem]" : "h-[22px] px-2 text-[0.75rem]",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {variant === "platform" ? <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" /> : null}
      {dot ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-round", dot)} /> : null}
      <span className="inline-flex min-w-0 items-center gap-1 truncate">{children}</span>
    </span>
  );
}

const ORDER_STATUS_VARIANT: Record<string, PlateVariant> = {
  PENDING: "neutral",
  CONFIRMED: "info",
  PAID: "info",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  REFUND_PENDING: "warning",
  CANCELLED: "neutral",
  REFUNDED: "neutral",
  FAILED: "danger",
};

export function statusPlateVariant(status: string): PlateVariant {
  return ORDER_STATUS_VARIANT[status.toUpperCase()] ?? "neutral";
}

export function StatusPlate({ status, label, className }: { status: string; label?: string; className?: string }) {
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <Plate variant={statusPlateVariant(status)} className={className}>
      {text}
    </Plate>
  );
}
