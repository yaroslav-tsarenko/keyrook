import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { HomePlatform } from "./types";

export function HomeHeading({ id, eyebrow, title, className, size = "h2" }: { id: string; eyebrow?: string; title: ReactNode; className?: string; size?: "h2" | "display" }) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="eyebrow m-0 mb-4" data-anim="plate">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} data-anim="plate" className={cn("m-0 text-ink", size === "display" ? "text-step-6 leading-[0.98] tracking-[-0.015em] [font-weight:740]" : "text-step-4 leading-[1.06]")}>
        {title}
      </h2>
    </div>
  );
}

export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("btn-text inline-flex min-h-11 items-center gap-2 text-ui-md font-[560] text-ink", className)}>
      <span data-label="">{children}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function PlatformPlates({ platforms, label, className, scroller = false }: { platforms: HomePlatform[]; label: string; className?: string; scroller?: boolean }) {
  return (
    <ul aria-label={label} className={cn("m-0 flex list-none gap-2 p-0", scroller ? "no-scrollbar -mx-gutter flex-nowrap overflow-x-auto px-gutter sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" : "flex-wrap", className)}>
      {platforms.map((p) => (
        <li key={p.key} data-platform={p.tone} className="shrink-0">
          <Link
            href={p.href}
            className="group inline-flex h-10 items-center gap-2.5 border border-line bg-surface px-3 transition-colors duration-[120ms] hover-device:hover:border-control hover-device:hover:bg-raised"
          >
            <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
            <span className="eyebrow text-ink">{p.short}</span>
            <span className="font-mono text-data-sm text-ink-muted">{p.count.toLocaleString("en-GB")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
