"use client";

import Link from "next/link";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";

export interface IndexLink {
  slug: string;
  label: string;
  count: number;
  href: string;
  active?: boolean;
}

export interface CategoryOpenerProps {
  name: string;
  count: number;
  lead?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  index?: IndexLink[];
  indexLabel?: string;
  typeIndex?: IndexLink[];
  typeIndexLabel?: string;
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

export function CategoryOpener({ name, count, lead, minPrice, maxPrice, index = [], indexLabel = "Platforms", typeIndex = [], typeIndexLabel = "Product types" }: CategoryOpenerProps) {
  return (
    <header data-category-opener="" className="pb-8 pt-1 lg:pb-10">
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className={cn("min-w-0", typeIndex.length ? "lg:col-span-7" : "lg:col-span-12")}>
          <h1 className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">
            {name}
            <span className="font-mono text-data font-normal tracking-normal text-ink-muted">{count.toLocaleString("en-GB")}</span>
          </h1>
          {lead ? <p className="measure m-0 mt-4 text-step-1 leading-[1.5] text-ink-muted">{lead}</p> : null}
          {minPrice != null && maxPrice != null && count > 0 ? (
            <p className="m-0 mt-3 text-ui-md text-ink-muted">
              {count.toLocaleString("en-GB")} {count === 1 ? "product" : "products"} available, <PriceSpan min={minPrice} max={maxPrice} />.
            </p>
          ) : null}
        </div>
        {typeIndex.length ? (
          <nav aria-label={typeIndexLabel} className="lg:col-span-5">
            <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-1 p-0 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2">
              {typeIndex.map((l) => (
                <li key={l.slug}>
                  <Link href={l.href} className="indicator-bar label-caps inline-flex min-h-9 items-baseline gap-2 text-[0.9375rem] text-ink hover-device:hover:[&::after]:scale-x-100">
                    {l.label}
                    <span className="font-mono text-[0.75rem] font-normal normal-case tracking-normal text-ink-subtle">{l.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
      {index.length ? (
        <nav aria-label={indexLabel} className="mt-8 border-t border-line pt-4">
          <ul className="no-scrollbar -mx-gutter m-0 flex list-none gap-x-6 gap-y-2 overflow-x-auto px-gutter py-0 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {index.map((l) => (
              <li key={l.slug} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={l.active ? "page" : undefined}
                  className="inline-flex min-h-10 items-baseline gap-1.5 font-display text-[0.9375rem] font-semibold text-ink-muted decoration-1 underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline aria-[current]:text-ink aria-[current]:underline aria-[current]:decoration-accent-ink aria-[current]:decoration-2"
                >
                  {l.label}
                  <span className="font-mono text-[0.75rem] font-normal text-ink-subtle">{l.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
