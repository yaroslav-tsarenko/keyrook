import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft" | "light" | "flat" | "bordered" | "account";
export type ButtonColor = "primary" | "danger" | "success" | "warning" | "default";
type Kind = "key" | "steel" | "text" | "danger" | "danger-text";

const SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-3.5 text-[0.8125rem]",
  md: "h-11 px-5 text-[0.875rem]",
  lg: "h-[52px] px-7 text-[0.9375rem]",
};

const TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "min-h-9 text-ui-sm",
  md: "min-h-11 text-ui-md",
  lg: "min-h-[52px] text-step-0",
};

function resolveKind(variant: ButtonVariant, color?: ButtonColor): Kind {
  if (color === "danger") {
    return variant === "flat" || variant === "light" || variant === "ghost" || variant === "tertiary" || variant === "danger-soft" ? "danger-text" : "danger";
  }
  switch (variant) {
    case "secondary":
    case "outline":
    case "bordered":
    case "account":
      return "steel";
    case "tertiary":
    case "ghost":
    case "light":
    case "flat":
      return "text";
    case "danger":
      return "danger";
    case "danger-soft":
      return "danger-text";
    default:
      return "key";
  }
}

const PRESS = "active:translate-y-px active:shadow-machined-pressed";

function kindClasses(kind: Kind, disabled: boolean) {
  if (kind === "key") {
    if (disabled) return "bg-surface-1 text-ink-subtle";
    return cn("bg-brand text-on-brand shadow-machined [[data-theme=light]_&]:border [[data-theme=light]_&]:border-accent-edge", "hover-device:hover:bg-brand-hover", PRESS);
  }
  if (kind === "danger") {
    if (disabled) return "bg-surface-1 text-ink-subtle";
    return cn("bg-danger text-on-danger shadow-machined hover-device:hover:brightness-[1.05]", PRESS);
  }
  if (kind === "steel") {
    if (disabled) return "border border-line bg-surface-1 text-ink-subtle";
    return cn("border border-control bg-plate text-ink shadow-machined hover-device:hover:border-ink hover-device:hover:bg-raised", PRESS);
  }
  const base = "btn-text font-sans font-[560] normal-case tracking-normal [font-stretch:100%]";
  if (kind === "danger-text") {
    if (disabled) return cn(base, "text-ink-subtle");
    return cn(base, "text-danger");
  }
  if (disabled) return cn(base, "text-ink-subtle");
  return cn(base, "text-ink active:text-accent-ink");
}

export function buttonClasses({
  variant = "primary",
  color,
  size = "md",
  isIconOnly = false,
  fullWidth = false,
  disabled = false,
  className,
}: {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: "sm" | "md" | "lg";
  isIconOnly?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const kind = resolveKind(variant, color);
  if (isIconOnly) {
    if (kind === "steel" || kind === "key") {
      return cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center touch-device:size-11 transition-[color,background-color,border-color,box-shadow,transform] duration-[120ms]",
        kindClasses(kind, disabled),
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      );
    }
    return cn(
      "relative inline-flex size-10 shrink-0 items-center justify-center touch-device:size-11 transition-colors duration-[120ms]",
      disabled ? "cursor-not-allowed text-ink-subtle" : cn(kind === "danger" || kind === "danger-text" ? "text-danger" : "text-ink", "cursor-pointer hover-device:hover:bg-raised active:bg-surface-1"),
      className,
    );
  }
  const isText = kind === "text" || kind === "danger-text";
  return cn(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none leading-none",
    !isText && "label-caps",
    "transition-[transform,color,background-color,border-color,box-shadow,filter] duration-[120ms] ease-[var(--ease-latch)]",
    "focus-visible:outline-offset-2",
    isText ? TEXT_SIZE[size] : SIZE[size],
    kindClasses(kind, disabled),
    disabled ? "cursor-not-allowed" : "cursor-pointer",
    fullWidth && "w-full",
    className,
  );
}
