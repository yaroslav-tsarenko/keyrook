import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft" | "light" | "flat" | "bordered" | "steam";
export type ButtonColor = "primary" | "danger" | "success" | "warning" | "default";
type Kind = "indicator" | "outline" | "text" | "danger" | "danger-text" | "account";

const SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-3.5 text-[0.875rem]",
  md: "h-11 px-5 text-[1rem]",
  lg: "h-[52px] px-7 text-[1.125rem]",
};

const TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "min-h-9 text-ui-sm",
  md: "min-h-11 text-ui-md",
  lg: "min-h-[52px] text-step-0",
};

function resolveKind(variant: ButtonVariant, color?: ButtonColor): Kind {
  if (variant === "steam") return "account";
  if (color === "danger") {
    return variant === "flat" || variant === "light" || variant === "ghost" || variant === "tertiary" || variant === "danger-soft"
      ? "danger-text"
      : "danger";
  }
  switch (variant) {
    case "secondary":
    case "outline":
    case "bordered":
      return "outline";
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
      return "indicator";
  }
}

const BOXED_DISABLED = "rounded-control bg-surface-1 text-ink-subtle";

function kindClasses(kind: Kind, disabled: boolean) {
  if (kind === "indicator") {
    if (disabled) return BOXED_DISABLED;
    return cn(
      "rounded-control bg-brand text-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] [[data-theme=light]_&]:border [[data-theme=light]_&]:border-accent-edge",
      "hover-device:hover:bg-brand-hover hover-device:hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] active:translate-y-px",
    );
  }
  if (kind === "account") {
    if (disabled) return BOXED_DISABLED;
    return "rounded-control bg-ink text-surface hover-device:hover:bg-ink-muted active:translate-y-px";
  }
  if (kind === "danger") {
    if (disabled) return BOXED_DISABLED;
    return "rounded-control bg-danger text-on-danger hover-device:hover:brightness-[1.06] active:translate-y-px";
  }
  if (kind === "outline") {
    if (disabled) return "rounded-control border border-line text-ink-subtle";
    return "rounded-control border border-control text-ink hover-device:hover:border-ink hover-device:hover:bg-raised active:translate-y-px active:bg-brand-soft";
  }
  if (kind === "danger-text") {
    if (disabled) return "text-ink-subtle";
    return "font-sans font-semibold normal-case tracking-normal text-danger decoration-1 underline-offset-4 hover-device:hover:underline";
  }
  if (disabled) return "font-sans font-semibold normal-case tracking-normal text-ink-subtle";
  return "font-sans font-semibold normal-case tracking-normal text-ink decoration-1 underline-offset-4 hover-device:hover:underline active:underline active:decoration-accent-ink";
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
    return cn(
      "relative inline-flex shrink-0 items-center justify-center size-10 touch-device:size-11 rounded-control transition-colors duration-[140ms]",
      disabled
        ? "text-ink-subtle cursor-not-allowed"
        : cn(kind === "danger" || kind === "danger-text" ? "text-danger" : "text-ink", "cursor-pointer hover-device:hover:bg-raised active:bg-brand-soft"),
      className,
    );
  }
  const isText = kind === "text" || kind === "danger-text";
  return cn(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none leading-none",
    !isText && "label-caps",
    "transition-[transform,color,background-color,border-color,box-shadow,filter] duration-[140ms] ease-[var(--ease-instrument)]",
    "focus-visible:outline-offset-2",
    isText ? TEXT_SIZE[size] : SIZE[size],
    kindClasses(kind, disabled),
    disabled ? "cursor-not-allowed" : "cursor-pointer",
    fullWidth && "w-full",
    className,
  );
}

