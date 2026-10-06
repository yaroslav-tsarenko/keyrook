"use client";

import Link from "next/link";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { platformInfo, regionTag } from "@/lib/catalog/platforms";
import type { GiftCardGroup, Timetable } from "@/lib/catalog/prepaid";

function faceLabel(value: number | null, currency: string | null): string | null {
  if (value == null || !currency) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
}

export function SubscriptionTimetable({ table, caption }: { table: Timetable; caption: string }) {
  const { currency, convert } = useCurrency();
  if (!table.rows.length) return null;
  return (
    <div data-timetable="">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="eyebrow py-3 pr-4 font-semibold">
                Service
              </th>
              {table.columns.map((c) => (
                <th key={c.key} scope="col" className="eyebrow px-3 py-3 text-right font-semibold">
                  {c.label}
                </th>
              ))}
              <th scope="col" className="eyebrow py-3 pl-3 text-right font-semibold">
                Region
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              const p = platformInfo(row.platform);
              return (
                <tr key={row.key} data-platform={p.tone} className="border-b border-line">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
                      <span className="text-ui-md font-[560] text-ink">{row.service}</span>
                    </span>
                  </th>
                  {table.columns.map((c) => {
                    const cell = row.cells[c.key];
                    return (
                      <td key={c.key} className="px-3 py-2.5 text-right">
                        {cell ? (
                          <Link href={`/product/${cell.slug}`} className="price inline-flex min-h-9 items-center text-ui-md text-ink underline decoration-line-hover decoration-1 underline-offset-4 hover-device:hover:decoration-ink">
                            {formatPrice(convert(cell.price), currency)}
                          </Link>
                        ) : (
                          <span aria-label="Not in stock" className="font-mono text-ui-md text-ink-subtle">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 pl-3 text-right font-mono text-[0.75rem] font-medium uppercase text-ink">{regionTag(row.region)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="m-0 flex list-none flex-col border-t border-rule p-0 md:hidden">
        {table.rows.map((row) => {
          const p = platformInfo(row.platform);
          return (
            <li key={row.key} data-platform={p.tone} className="border-b border-line py-3">
              <p className="m-0 flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 bg-platform" />
                <span className="text-ui-md font-[560] text-ink">{row.service}</span>
                <span className="ml-auto font-mono text-[0.75rem] font-medium uppercase text-ink">{regionTag(row.region)}</span>
              </p>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                {table.columns
                  .filter((c) => row.cells[c.key])
                  .map((c) => (
                    <li key={c.key}>
                      <Link href={`/product/${row.cells[c.key].slug}`} className="inline-flex h-9 items-center gap-2 border border-control bg-plate px-3 text-ui-sm text-ink shadow-machined">
                        {c.label} <span className="price">· {formatPrice(convert(row.cells[c.key].price), currency)}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GiftCardShelf({ groups }: { groups: GiftCardGroup[] }) {
  const { currency, convert } = useCurrency();
  if (!groups.length) return null;
  const byPlatform = new Map<string, GiftCardGroup[]>();
  for (const g of groups) byPlatform.set(g.platform, [...(byPlatform.get(g.platform) ?? []), g]);
  return (
    <div data-giftcard-shelf="" className="flex flex-col gap-8">
      {[...byPlatform.entries()].map(([platform, list]) => {
        const p = platformInfo(platform);
        return (
          <section key={platform} data-platform={p.tone} aria-label={`${p.short} gift cards`}>
            <h3 className="m-0 mb-3 flex items-center gap-2">
              <span aria-hidden="true" className="size-2 bg-platform" />
              <span className="eyebrow text-ink">{p.short}</span>
            </h3>
            <div className="no-scrollbar -mx-gutter flex snap-x scroll-px-gutter gap-3 overflow-x-auto px-gutter sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {list.map((g) => {
                const values = g.products.filter((x) => x.value != null);
                const low = values[0] ? faceLabel(values[0].value, values[0].currency) : null;
                const high = values.length > 1 ? faceLabel(values[values.length - 1].value, values[values.length - 1].currency) : null;
                return (
                  <article key={g.key} data-giftcard="" className="plate flex aspect-[1.586/1] w-[78vw] max-w-[320px] shrink-0 snap-start flex-col justify-between p-4 sm:w-auto sm:max-w-none">
                    <div className="flex items-start justify-between gap-3">
                      <p className="m-0 flex items-center gap-2">
                        <span aria-hidden="true" className="size-1.5 bg-platform" />
                        <span className="eyebrow text-ink">{p.short}</span>
                      </p>
                      <span className="eyebrow" data-type="giftcard">
                        <span className="text-type">Gift card</span>
                      </span>
                    </div>
                    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={`${p.short} ${regionTag(g.region)} values`}>
                      {g.products.slice(0, 5).map((x) => (
                        <li key={x.id}>
                          <Link
                            href={`/product/${x.slug}`}
                            title={`Price ${formatPrice(convert(x.price), currency)}`}
                            className="inline-flex h-9 items-center border border-control bg-plate px-2.5 font-mono text-[0.8125rem] text-ink shadow-machined hover-device:hover:border-ink"
                          >
                            {faceLabel(x.value, x.currency) ?? formatPrice(convert(x.price), currency)}
                          </Link>
                        </li>
                      ))}
                      {g.products.length > 5 ? (
                        <li>
                          <Link
                            href={`/catalog/gift-cards?platform=${encodeURIComponent(g.platform)}&region=${encodeURIComponent(g.region)}`}
                            aria-label={`All ${g.products.length} ${p.short} ${regionTag(g.region)} values`}
                            className="inline-flex h-9 items-center px-1.5 font-mono text-[0.8125rem] text-ink-muted underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline"
                          >
                            +{g.products.length - 5}
                          </Link>
                        </li>
                      ) : null}
                    </ul>
                    <div className="flex items-end justify-between gap-3">
                      <span className="price text-step-3 leading-none text-ink">{low ? (high ? `${low}–${high}` : low) : ""}</span>
                      <span className="font-mono text-[0.75rem] font-medium uppercase text-ink">{regionTag(g.region)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
