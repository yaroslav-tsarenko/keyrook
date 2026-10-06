"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarSync, PackagePlus, WalletCards } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import { Tumbler } from "@/components/ui/Tumbler";

export interface IndexLink {
  slug: string;
  label: string;
  count: number;
  href: string;
  active?: boolean;
  platform?: string | null;
}

export function PriceSpan({ min, max }: { min: number; max: number }) {
  const { currency, convert } = useCurrency();
  const money = (n: number) => formatPrice(convert(n), currency);
  return (
    <>
      from <span className="font-mono text-data text-ink">{money(min)}</span> to <span className="font-mono text-data text-ink">{money(max)}</span>
    </>
  );
}

export function FromPrice({ min }: { min: number }) {
  const { currency, convert } = useCurrency();
  return <span className="font-mono text-data text-ink">from {formatPrice(convert(min), currency)}</span>;
}

export function IndexRow({ links, label, className, size = "md" }: { links: IndexLink[]; label: string; className?: string; size?: "sm" | "md" }) {
  if (!links.length) return null;
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
        {links.map((l) => (
          <li key={l.slug} data-platform={l.platform ?? undefined}>
            <Link
              href={l.href}
              aria-current={l.active ? "page" : undefined}
              className={cn("active-bar inline-flex items-baseline gap-2 py-1.5 text-ink hover-device:hover:[&::after]:scale-x-100", size === "sm" ? "min-h-9" : "min-h-10")}
            >
              {l.platform ? <span aria-hidden="true" className="size-1.5 translate-y-[-1px] self-center bg-platform" /> : null}
              <span className="eyebrow text-ink">{l.label}</span>
              <span className="font-mono text-[0.75rem] text-ink-muted">{l.count.toLocaleString("en-GB")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const TYPE_ICON = { dlc: PackagePlus, "gift-cards": WalletCards, subscriptions: CalendarSync } as const;

export interface CategoryOpenerProps {
  name: string;
  count: number;
  lead?: ReactNode;
  note?: ReactNode;
  minPrice?: number | null;
  maxPrice?: number | null;
  index?: IndexLink[];
  indexLabel?: string;
  typeIndex?: IndexLink[];
  typeIndexLabel?: string;
  icon?: keyof typeof TYPE_ICON | null;
}

export function CategoryOpener({ name, count, lead, note, minPrice, maxPrice, index = [], indexLabel = "Platforms", typeIndex = [], typeIndexLabel = "Types", icon = null }: CategoryOpenerProps) {
  const Icon = icon ? TYPE_ICON[icon] : null;
  return (
    <header data-category-opener="" className="pb-8 pt-1 lg:pb-10">
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-12 lg:items-end">
        <div className={cn("min-w-0", typeIndex.length ? "lg:col-span-7" : "lg:col-span-12")}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {Icon ? <Icon size={24} aria-hidden="true" className="text-ink-muted" /> : null}
            <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{name}</h1>
            <Tumbler value={count} label={`${count.toLocaleString("en-GB")} keys in stock`} size="sm" />
          </div>
          {lead ? <p className="measure m-0 mt-3 text-step-1 leading-[1.5] text-ink-muted">{lead}</p> : null}
          {note ? <div className="mt-3">{note}</div> : null}
          {minPrice != null && maxPrice != null && count > 0 ? (
            <p className="m-0 mt-2 text-ui-md text-ink-muted">
              Priced <PriceSpan min={minPrice} max={maxPrice} />.
            </p>
          ) : null}
        </div>
        {typeIndex.length ? <IndexRow links={typeIndex} label={typeIndexLabel} className="lg:col-span-5 lg:justify-self-end" /> : null}
      </div>
      {index.length ? <IndexRow links={index} label={indexLabel} size="sm" className="mt-6 border-t border-line pt-3" /> : null}
    </header>
  );
}

export function PlatformOpener({
  name,
  count,
  minPrice,
  sentence,
  guideHref,
  guideLabel,
  typeIndex,
  tone,
}: {
  name: string;
  count: number;
  minPrice: number | null;
  sentence: string;
  guideHref: string | null;
  guideLabel: string;
  typeIndex: IndexLink[];
  tone: string;
}) {
  return (
    <header data-platform-opener="" data-platform={tone} className="plate relative mb-8 mt-1 px-5 py-6 sm:px-8 sm:py-8 lg:mb-10">
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="min-w-0 lg:col-span-7">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="size-2.5 bg-platform" />
            <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{name}</h1>
          </div>
          <p className="m-0 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Tumbler value={count} label={`${count.toLocaleString("en-GB")} keys in stock`} size="md" />
            <span className="text-ui-md text-ink-muted">keys in stock</span>
            {minPrice != null ? <FromPrice min={minPrice} /> : null}
          </p>
          <p className="m-0 mt-4 max-w-[60ch] text-step-0 text-ink">{sentence}</p>
          {guideHref ? (
            <Link href={guideHref} className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-ui-md font-[560] text-ink underline-offset-4 hover-device:hover:underline">
              {guideLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div className="min-w-0 lg:col-span-5">
          <p className="eyebrow m-0 mb-2">By type</p>
          <ul className="m-0 list-none border-t border-line p-0">
            {typeIndex.map((l) => (
              <li key={l.slug} className="border-b border-line">
                <Link href={l.href} className="flex min-h-11 items-center justify-between gap-4 text-ink hover-device:hover:bg-raised">
                  <span className="eyebrow pl-1 text-ink">{l.label}</span>
                  <span className="pr-1 font-mono text-data text-ink-muted">{l.count.toLocaleString("en-GB")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
