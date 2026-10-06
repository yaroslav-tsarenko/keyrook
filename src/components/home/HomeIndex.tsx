"use client";

import Link from "next/link";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import type { HomeIndexEntry } from "./types";
import { SectionHead } from "./SectionHead";

export function HomeIndex({ types, platforms }: { types: HomeIndexEntry[]; platforms: HomeIndexEntry[] }) {
  const { currency, convert } = useCurrency();
  if (types.length === 0) return null;
  const from = (n: number | null) => (n === null ? null : `from ${formatPrice(convert(n), currency)}`);
  return (
    <section aria-labelledby="index-title" data-section="shop-by" className="border-t border-line">
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-12 px-gutter py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHead id="index-title" title="Shop by type" lead="What each kind of product is, and what you need to redeem it." />
          <ul className="m-0 mt-8 list-none border-t border-line p-0">
            {types.map((t) => (
              <li key={t.key} className="border-b border-line">
                <Link href={t.href} className="group grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]">
                  <span className="font-display text-step-2 font-semibold leading-none text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{t.name}</span>
                  <span className="text-ui-md text-ink-muted">{t.lead}</span>
                  <span className="font-mono text-[0.75rem] text-ink-muted sm:text-right">
                    {t.count.toLocaleString("en-GB")}
                    <span className="block">{from(t.minPrice)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <h2 className="eyebrow m-0">By platform</h2>
          <ul className="m-0 mt-4 list-none border-t border-line p-0">
            {platforms.map((p) => (
              <li key={p.key} className="border-b border-line">
                <Link href={p.href} className="flex min-h-12 items-baseline justify-between gap-4 py-3 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                  {p.name}
                  <span className="font-mono text-[0.75rem] font-normal text-ink-muted">{p.count.toLocaleString("en-GB")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
