import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PlateVariant = "rarity" | "stattrak" | "souvenir" | "star" | "phase" | "neutral" | "success" | "warning" | "danger" | "info" | "indicator";

const VARIANT: Record<PlateVariant, string> = {
  rarity: "border border-line text-rarity shadow-[inset_2px_0_0_var(--rarity)] pl-2.5",
  stattrak: "border border-line text-mark-stattrak",
  souvenir: "border border-line text-mark-souvenir",
  star: "border border-line text-rarity-gold",
  phase: "border border-line text-ink",
  neutral: "bg-surface-1 text-ink",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  indicator: "bg-brand text-on-brand",
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
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control font-mono font-medium uppercase leading-none tracking-[0.06em] [font-stretch:87.5%]",
        size === "sm" ? "h-5 px-1.5 text-[0.6875rem]" : "h-[22px] px-2 text-[0.75rem]",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {dot ? <span aria-hidden="true" className={cn("size-1.5 shrink-0", dot)} /> : null}
      <span className="inline-flex min-w-0 items-center gap-1 truncate">{children}</span>
    </span>
  );
}

const ORDER_STATUS_VARIANT: Record<string, PlateVariant> = {
  PENDING: "neutral",
  CONFIRMED: "info",
  PAID: "success",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
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
