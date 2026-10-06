"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

type PageToken = number | "start-gap" | "end-gap";

export function pageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tokens: PageToken[] = [1];
  if (page > 3) tokens.push("start-gap");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) tokens.push(i);
  if (page < totalPages - 2) tokens.push("end-gap");
  tokens.push(totalPages);
  return tokens;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  hrefForPage?: (page: number) => string;
  className?: string;
}

const textLinkCls =
  "inline-flex min-h-10 items-center gap-1.5 text-ui-sm font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline";

export function Pagination({ page, totalPages, onPageChange, hrefForPage, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const control = (target: number, children: React.ReactNode, props: { className: string; label?: string; current?: boolean }) => {
    if (hrefForPage) {
      return (
        <Link href={hrefForPage(target)} className={props.className} aria-label={props.label} aria-current={props.current ? "page" : undefined}>
          {children}
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => onPageChange?.(target)} className={props.className} aria-label={props.label} aria-current={props.current ? "page" : undefined}>
        {children}
      </button>
    );
  };

  const prev =
    page > 1 ? (
      control(page - 1, (<><ChevronLeft size={16} aria-hidden="true" />Previous</>), { className: cn(textLinkCls, "cursor-pointer") })
    ) : (
      <span className={cn(textLinkCls, "cursor-not-allowed text-ink-subtle no-underline")} aria-disabled="true">
        <ChevronLeft size={16} aria-hidden="true" />
        Previous
      </span>
    );
  const next =
    page < totalPages ? (
      control(page + 1, (<>Next<ChevronRight size={16} aria-hidden="true" /></>), { className: cn(textLinkCls, "cursor-pointer") })
    ) : (
      <span className={cn(textLinkCls, "cursor-not-allowed text-ink-subtle no-underline")} aria-disabled="true">
        Next
        <ChevronRight size={16} aria-hidden="true" />
      </span>
    );

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-4 sm:justify-center sm:gap-6", className)}>
      {prev}
      <ol className="hidden items-center gap-1 sm:flex">
        {pageTokens(page, totalPages).map((token) =>
          typeof token === "number" ? (
            <li key={token}>
              {token === page ? (
                <span aria-current="page" className="relative flex size-10 items-center justify-center rounded-control font-mono text-data text-ink after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-brand">
                  {token}
                </span>
              ) : (
                control(token, token, {
                  className: "flex size-10 cursor-pointer items-center justify-center rounded-control font-mono text-data text-ink-muted transition-colors duration-[140ms] hover-device:hover:bg-raised hover-device:hover:text-ink",
                  label: `Page ${token}`,
                })
              )}
            </li>
          ) : (
            <li key={token} aria-hidden="true" className="flex size-10 items-center justify-center font-mono text-data text-ink-subtle">
              …
            </li>
          ),
        )}
      </ol>
      <p className="font-mono text-data text-ink-muted sm:hidden">
        Page {page} of {totalPages}
      </p>
      {next}
    </nav>
  );
}

export function LoadMore({ shown, total, onLoadMore, loading, className }: { shown: number; total: number; onLoadMore: () => void; loading?: boolean; className?: string }) {
  if (shown >= total) return null;
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p className="font-mono text-data text-ink-muted">
        Showing {shown} of {total}
      </p>
      <Button variant="outline" onPress={onLoadMore} isLoading={loading}>
        Load more
      </Button>
    </div>
  );
}
