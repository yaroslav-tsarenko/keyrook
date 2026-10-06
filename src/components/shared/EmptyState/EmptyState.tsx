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
  actionVariant?: "primary" | "outline";
  secondaryLabel?: string;
  secondaryHref?: string;
  headingLevel?: 1 | 2 | 3;
  align?: "center" | "start";
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function EmptyBox({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 104"
      width="160"
      height="104"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={cn("text-ink-muted", className)}
    >
      <path d="M20 8h120v60H20z" />
      <path d="M28 16h104v44H28z" opacity="0.45" />
      <path d="M8 52h144v44H8z" />
      <path d="M8 52l12-16M152 52l-12-16" />
      <path d="M20 36h120" opacity="0.45" />
      <path d="M64 72h32v8H64z" />
      <path d="M20 68v28M140 68v28" opacity="0.45" />
    </svg>
  );
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  actionVariant = "primary",
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
    <div data-empty="" className={cn("flex flex-col gap-3 px-4 py-16", centered ? "items-center text-center" : "items-start", className)}>
      <EmptyBox />
      <Heading className="m-0 mt-4 text-step-2 font-semibold leading-[1.15] text-ink">{title}</Heading>
      {subtitle ? <p className={cn("m-0 max-w-[48ch] text-ink-muted", centered && "mx-auto")}>{subtitle}</p> : null}
      {children}
      {(actionLabel && (actionHref || onAction)) || (secondaryLabel && secondaryHref) ? (
        <div className={cn("mt-3 flex flex-wrap items-center gap-x-6 gap-y-3", centered && "justify-center")}>
          {actionLabel && actionHref ? (
            <Button as={Link} href={actionHref} variant={actionVariant}>
              {actionLabel}
            </Button>
          ) : actionLabel && onAction ? (
            <Button variant={actionVariant} onPress={onAction}>
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
