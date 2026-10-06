"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  headingLevel?: 1 | 2 | 3;
  align?: "center" | "start";
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function EmptyBay({ className }: { className?: string }) {
  return <div aria-hidden="true" data-stage="" data-lamp="on" className={cn("stage h-[120px] w-[160px] rounded-tray", className)} />;
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  headingLevel = 2,
  align = "center",
  children,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const centered = align === "center";
  return (
    <div className={cn("flex flex-col gap-3 px-4 py-16", centered ? "items-center text-center" : "items-start", className)}>
      <EmptyBay />
      <Heading className="mt-3 text-step-2 font-semibold leading-[1.12] text-ink">{title}</Heading>
      {subtitle ? <p className={cn("max-w-[48ch] text-ink-muted", centered && "mx-auto")}>{subtitle}</p> : null}
      {children}
      {(actionLabel && (actionHref || onAction)) || (secondaryLabel && secondaryHref) ? (
        <div className={cn("mt-2 flex flex-wrap items-center gap-x-6 gap-y-3", centered && "justify-center")}>
          {actionLabel && actionHref ? (
            <Button as={Link} href={actionHref} variant="primary">
              {actionLabel}
            </Button>
          ) : actionLabel && onAction ? (
            <Button variant="primary" onPress={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Button as={Link} href={secondaryHref} variant="ghost">
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
