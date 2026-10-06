"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, CalendarSync, PackagePlus, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Lamp } from "@/components/ui/Lamp";
import { Cover } from "@/components/product/Cover";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import type { StoreIndex } from "@/lib/catalog/store-index";

const TYPE_ICON: Record<string, typeof PackagePlus> = { dlc: PackagePlus, "gift-card": WalletCards, subscription: CalendarSync };

export function bandHref(band: { baseMin: number | null; baseMax: number | null }) {
  const qs = new URLSearchParams();
  if (band.baseMin !== null) qs.set("minPrice", String(band.baseMin));
  if (band.baseMax !== null) qs.set("maxPrice", String(band.baseMax));
  return `/catalog?${qs.toString()}`;
}

export interface VaultMapProps {
  id: string;
  open: boolean;
  index: StoreIndex | null;
  onClose: (restoreFocus?: boolean) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function VaultMap({ id, open, index, onClose, onPointerEnter, onPointerLeave }: VaultMapProps) {
  const { currency, convert } = useCurrency();
  const [pointed, setPointed] = useState<string | null>(null);
  const money = (n: number) => formatPrice(convert(n), currency);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const target = e.target as HTMLElement;
    const column = target.closest<HTMLElement>("[data-board-col]");
    if (!column) return;
    const columns = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-board-col]"));
    const links = Array.from(column.querySelectorAll<HTMLAnchorElement>("a"));
    const i = links.indexOf(target as HTMLAnchorElement);
    e.preventDefault();
    if (e.key === "ArrowDown") links[Math.min(links.length - 1, i + 1)]?.focus();
    else if (e.key === "ArrowUp") links[Math.max(0, i - 1)]?.focus();
    else {
      const ci = columns.indexOf(column);
      const next = columns[e.key === "ArrowRight" ? Math.min(columns.length - 1, ci + 1) : Math.max(0, ci - 1)];
      next?.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };

  if (!open) return null;

  const platforms = index?.platforms ?? [];
  const focus = platforms.find((p) => p.key === pointed) ?? platforms[0] ?? null;
  const bands = index?.bands[currency] ?? [];

  return (
    <div
      id={id}
      data-vault-map=""
      data-scene="lockers"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && (e.currentTarget.contains(next) || (next as HTMLElement).closest?.("[data-board-trigger]"))) return;
        onClose(false);
      }}
      className="absolute inset-x-0 top-full z-50 max-h-[76vh] animate-panel-in overflow-y-auto border-t border-line bg-rig text-ink shadow-lg"
    >
      <div className="mx-auto grid max-w-container grid-cols-12 gap-x-8 gap-y-8 px-gutter py-8">
        <section aria-label="Platforms" data-board-col="" className="col-span-8">
          <p className="eyebrow m-0 mb-3">Platforms</p>
          <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0">
            {platforms.map((p, i) => {
              const lit = focus?.key === p.key && pointed !== null;
              return (
                <li key={p.key} data-platform={p.tone} className={cn(i === 0 && "col-span-2")}>
                  <Link
                    href={`/platform/${p.slug}`}
                    data-locker=""
                    onFocus={() => setPointed(p.key)}
                    onPointerEnter={() => setPointed(p.key)}
                    onClick={() => onClose(false)}
                    className="plate relative flex h-[92px] flex-col justify-between p-3 transition-colors duration-[120ms] hover-device:hover:bg-raised focus-visible:outline-offset-[-2px]"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
                        <span className="eyebrow truncate text-ink">{p.short}</span>
                      </span>
                      <Lamp on={lit} />
                    </span>
                    <span className="flex items-baseline justify-between gap-2 font-mono text-[0.75rem] text-ink-muted">
                      <span>
                        <span className="text-ink">{p.count.toLocaleString("en-GB")}</span> keys
                      </span>
                      {p.minPrice != null ? <span>from {money(p.minPrice)}</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Types and price" data-board-col="" className="col-span-2">
          <p className="eyebrow m-0 mb-3">Types</p>
          <ul className="m-0 list-none p-0">
            {(index?.types ?? []).map((t) => {
              const Icon = TYPE_ICON[t.key];
              return (
                <li key={t.key}>
                  <Link href={`/catalog/${t.slug}`} onClick={() => onClose(false)} className="flex min-h-9 items-center gap-2 text-ui-md text-ink hover-device:hover:underline hover-device:hover:underline-offset-4">
                    {Icon ? <Icon size={16} aria-hidden="true" className="text-ink-muted" /> : <span aria-hidden="true" className="w-4" />}
                    <span className="flex-1">{t.label}</span>
                    <span className="font-mono text-[0.75rem] text-ink-muted">{t.count.toLocaleString("en-GB")}</span>
                  </Link>
                </li>
              );
            })}
            <li className="my-2 h-px bg-line" aria-hidden="true" />
            {bands.map((b) => (
              <li key={b.key}>
                <Link href={bandHref(b)} onClick={() => onClose(false)} className="flex min-h-9 items-center justify-between gap-2 text-ui-md text-ink hover-device:hover:underline hover-device:hover:underline-offset-4">
                  <span>{b.label}</span>
                  <span className="font-mono text-[0.75rem] text-ink-muted">{b.count.toLocaleString("en-GB")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={focus ? `${focus.short} preview` : "Preview"} data-board-col="" className="col-span-2 border-l border-line pl-6">
          {focus ? (
            <>
              <p className="eyebrow m-0 mb-3" data-platform={focus.tone}>
                <span aria-hidden="true" className="mr-2 inline-block size-1.5 bg-platform" />
                {focus.short}
              </p>
              {focus.covers.length ? (
                <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
                  {focus.covers.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/product/${c.slug}`} onClick={() => onClose(false)} className="group block" aria-label={c.title}>
                        <span className="block bg-plate p-1 shadow-machined">
                          <Cover src={c.imageUrl} alt="" compact sizes="80px" />
                        </span>
                        <span className="mt-1.5 block truncate text-[0.75rem] text-ink group-hover:underline">{c.title}</span>
                        <span className="block font-mono text-[0.75rem] text-ink-muted">{money(c.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href={`/platform/${focus.slug}`} onClick={() => onClose(false)} className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-ui-sm font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                All {focus.short} keys · <span className="font-mono">{focus.count.toLocaleString("en-GB")}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          ) : null}
        </section>

        {index?.genres.length ? (
          <nav aria-label="Genres" data-board-col="" className="col-span-12 border-t border-line pt-5">
            <ul className="m-0 flex list-none flex-wrap items-baseline gap-x-5 gap-y-1 p-0">
              <li className="eyebrow mr-2">Genres</li>
              {index.genres.slice(0, 12).map((g) => (
                <li key={g.key}>
                  <Link href={`/genre/${g.key}`} onClick={() => onClose(false)} className="inline-flex min-h-9 items-baseline gap-1.5 text-ui-md text-ink underline-offset-4 hover-device:hover:underline">
                    {g.label}
                    <span className="font-mono text-[0.75rem] text-ink-muted">{g.count.toLocaleString("en-GB")}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/catalog" onClick={() => onClose(false)} className="inline-flex min-h-9 items-center gap-1 text-ui-md font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                  All keys
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
