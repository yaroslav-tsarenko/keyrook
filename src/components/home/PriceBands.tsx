"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Choice";
import { ProductCard } from "@/components/product/ProductCard";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import type { HomePriceBand } from "./types";
import { TextLink } from "./SectionHead";

export function PriceBands({ bands }: { bands: HomePriceBand[] }) {
  const { currency, convert } = useCurrency();
  const [active, setActive] = useState(bands[0]?.key ?? "");
  const [swapped, setSwapped] = useState(false);
  if (bands.length === 0) return null;
  const whole = (n: number) => formatPrice(Math.round(convert(n)), currency).replace(/\.00$/, "");
  const under = (b: HomePriceBand) => b.max !== null && (b.min === null || bands.some((o) => o.min === null && o.max === b.min));
  const label = (b: HomePriceBand) => (under(b) ? `Under ${whole(b.max as number)}` : b.max === null ? `${whole(b.min ?? 0)} and up` : `${whole(b.min ?? 0)}–${whole(b.max)}`);
  const band = bands.find((b) => b.key === active) ?? bands[0];
  const [feature, ...rest] = band.products;
  const query = new URLSearchParams();
  if (band.min !== null && !under(band)) query.set("minPrice", String(band.min));
  if (band.max !== null) query.set("maxPrice", String(band.max));
  query.set("type", "dlc,game");
  const total = under(band) ? bands.filter((b) => b.max !== null && b.max <= (band.max as number)).reduce((sum, b) => sum + b.total, 0) : band.total;

  return (
    <section aria-labelledby="price-title" data-section="by-price" className="bg-surface-1">
      <div className="mx-auto max-w-wide px-gutter py-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <h2 id="price-title" className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
              By price
            </h2>
            <p className="m-0 mt-3 text-step-0 text-ink-muted">Games and DLC from across each price band, shown in your currency.</p>
          </div>
          <div className="no-scrollbar -mx-gutter max-w-[100vw] overflow-x-auto px-gutter">
            <Segmented
              label="Price band"
              value={band.key}
              onChange={(key) => {
                setActive(key);
                setSwapped(true);
              }}
              options={bands.map((b) => ({ value: b.key, label: label(b) }))}
            />
          </div>
        </div>
        <div data-band-grid="" data-swapped={swapped || undefined} role="region" aria-live="polite" aria-label={label(band)} className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {feature ? (
            <div key={feature.id} className="col-span-2 lg:row-span-2">
              <ProductCard product={feature} variant="feature" fill sizes="(min-width: 1024px) 640px, 100vw" />
            </div>
          ) : null}
          {rest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 font-mono text-data text-ink-muted">{total.toLocaleString("en-GB")} products in this range</p>
          <TextLink href={`/catalog?${query.toString()}`}>All products in this range</TextLink>
        </div>
      </div>
    </section>
  );
}
