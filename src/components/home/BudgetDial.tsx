"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { DepositBox, type CatalogProduct } from "@/components/product/ProductCard";
import { Tumbler } from "@/components/ui/Tumbler";
import { MERCH } from "@/config/merchandising";
import { useCurrency } from "@/providers/CurrencyProvider";
import { cn } from "@/lib/utils/cn";
import { HomeHeading } from "./parts";
import type { HomeBand } from "./types";

const STEP = 72;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function angleOf(e: PointerEvent, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const x = e.clientX - (r.left + r.width / 2);
  const y = e.clientY - (r.top + r.height / 2);
  return (Math.atan2(y, x) * 180) / Math.PI + 90;
}

export function BudgetDial({ bands, products }: { bands: Record<string, HomeBand[]>; products: Record<string, CatalogProduct> }) {
  const t = useTranslations("home.budget");
  const { currency } = useCurrency();
  const list = bands[currency] ?? bands.EUR ?? Object.values(bands)[0] ?? [];
  const enabled = list.map((b) => b.total >= MERCH.bandMinimum && b.ids.length >= Math.min(4, MERCH.bandItems));
  const firstEnabled = Math.max(0, enabled.indexOf(true));
  const [active, setActive] = useState(() => (enabled[2] ? 2 : firstEnabled));
  const [drag, setDrag] = useState<number | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const start = useRef({ angle: 0, rot: 0 });
  const index = enabled[active] ? active : firstEnabled;
  const band = list[index];

  const labelOf = (b: HomeBand) => (b.min === null ? t("under", { max: money(b.max!, currency) }) : b.max === null ? t("over", { min: money(b.min, currency) }) : t("between", { min: money(b.min, currency), max: money(b.max, currency) }));
  const phraseOf = (b: HomeBand) => (b.min === null ? t("bandUnder", { max: money(b.max!, currency) }) : b.max === null ? t("bandOver", { min: money(b.min, currency) }) : t("bandBetween", { min: money(b.min, currency), max: money(b.max, currency) }));

  const nearest = (rot: number) => {
    const raw = Math.round(-rot / STEP);
    const clamped = Math.max(0, Math.min(list.length - 1, raw));
    if (enabled[clamped]) return clamped;
    let best = index;
    let dist = Infinity;
    enabled.forEach((on, i) => {
      if (on && Math.abs(i - clamped) < dist) {
        dist = Math.abs(i - clamped);
        best = i;
      }
    });
    return best;
  };

  const go = (dir: 1 | -1) => {
    for (let i = index + dir; i >= 0 && i < list.length; i += dir) {
      if (enabled[i]) {
        setActive(i);
        return;
      }
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") go(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") go(-1);
    else if (e.key === "Home") setActive(firstEnabled);
    else if (e.key === "End") setActive(enabled.lastIndexOf(true));
    else return;
    e.preventDefault();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !dialRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { angle: angleOf(e, dialRef.current), rot: -index * STEP };
    setDrag(-index * STEP);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null || !dialRef.current) return;
    let delta = angleOf(e, dialRef.current) - start.current.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const rot = Math.max(-(list.length - 1) * STEP - 20, Math.min(20, start.current.rot + delta));
    setDrag(rot);
    const next = nearest(rot);
    if (next !== index) setActive(next);
  };
  const onUp = () => {
    if (drag === null) return;
    setActive(nearest(drag));
    setDrag(null);
  };

  const rot = drag ?? -index * STEP;
  const shown = useMemo(() => (band ? band.ids.map((id) => products[id]).filter((p): p is CatalogProduct => Boolean(p)) : []), [band, products]);
  if (!band) return null;
  const href = `/catalog?${new URLSearchParams({ ...(band.baseMin !== null ? { minPrice: String(band.baseMin) } : {}), ...(band.baseMax !== null ? { maxPrice: String(Math.max(0, band.baseMax - 0.01).toFixed(2)) } : {}) }).toString()}`;
  const count = band.total.toLocaleString("en-GB");

  return (
    <section id="budget" aria-labelledby="budget-title" data-home-section="budget" className="bg-surface py-16 lg:py-24">
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-10 px-gutter lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <HomeHeading id="budget-title" title={t("title")} />
          <p className="m-0 mt-3 text-step-0 text-ink-muted">{t("lead")}</p>
          <div className="budget-dial mt-8" data-dragging={drag !== null || undefined}>
            <div
              ref={dialRef}
              role="slider"
              tabIndex={0}
              aria-label={t("dialLabel")}
              aria-valuemin={0}
              aria-valuemax={list.length - 1}
              aria-valuenow={index}
              aria-valuetext={t("valueText", { band: labelOf(band), count })}
              onKeyDown={onKey}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className="budget-dial-face"
            >
              <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <circle cx="150" cy="150" r="146" fill="var(--color-bg-tertiary)" stroke="var(--color-border)" />
                <g className="budget-ring" style={{ transform: `rotate(${rot}deg)` }}>
                  <circle cx="150" cy="150" r="138" fill="var(--color-plate)" stroke="var(--color-border-control)" />
                  {Array.from({ length: 100 }, (_, i) => {
                    const deg = i * 3.6;
                    const major = i % 5 === 0;
                    return <rect key={i} x="149.5" y="13" width="1" height={major ? 12 : 7} fill={major ? "var(--color-text-tertiary)" : "var(--color-border-hover)"} transform={`rotate(${deg} 150 150)`} />;
                  })}
                  {list.map((b, i) => (
                    <g key={b.key}>
                      <rect x="149" y="12" width="2" height="22" fill={enabled[i] ? "var(--color-text)" : "var(--color-border-hover)"} transform={`rotate(${i * STEP + STEP / 2} 150 150)`} />
                      {b.max !== null ? (
                        <g transform={`rotate(${i * STEP + STEP / 2} 150 150)`}>
                          <g style={{ transform: `rotate(${-(i * STEP + STEP / 2) - rot}deg)`, transformOrigin: "150px 46px", transformBox: "view-box" }} className="budget-numeral">
                            <text x="150" y="46" textAnchor="middle" dominantBaseline="central" fill="var(--color-text-secondary)" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500 }}>
                              {b.max}
                            </text>
                          </g>
                        </g>
                      ) : null}
                    </g>
                  ))}
                  <circle cx="150" cy="150" r="88" fill="var(--color-bg)" stroke="var(--color-border)" />
                </g>
                <circle cx="150" cy="150" r="58" fill="var(--color-plate)" stroke="var(--color-border-control)" />
                {Array.from({ length: 24 }, (_, i) => (
                  <rect key={i} x="148.5" y="94" width="3" height="8" fill="var(--color-border-hover)" transform={`rotate(${i * 15} 150 150)`} />
                ))}
                <circle cx="150" cy="150" r="40" fill="var(--color-raised)" stroke="var(--color-border)" />
                <rect x="149" y="0" width="2" height="16" fill="var(--color-accent)" />
              </svg>
              <span className="budget-readout">
                <span className="font-mono text-data-sm text-ink-muted">{currency}</span>
              </span>
            </div>
            {list.map((b, i) => (
              <button
                key={b.key}
                type="button"
                disabled={!enabled[i]}
                aria-pressed={i === index}
                onClick={() => setActive(i)}
                title={enabled[i] ? undefined : t("unavailable", { min: MERCH.bandMinimum })}
                className={cn("budget-label", i === index && "budget-label-on")}
                style={{ transform: `translate(-50%, -50%) rotate(${i * STEP + rot}deg) translateY(calc(var(--dial) * -0.6)) rotate(${-(i * STEP + rot)}deg)` }}
              >
                {labelOf(b)}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Tumbler value={band.total} size="lg" label={t("count", { count })} motion />
            <span className="eyebrow">{t("count", { count: "" }).trim()}</span>
          </div>
          <Link href={href} className="btn-text mt-3 inline-flex min-h-11 items-center gap-2 text-ui-md font-[560] text-ink">
            <span data-label="">{t("seeAll", { count, band: phraseOf(band) })}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <ul aria-label={`${t("gridLabel")}: ${labelOf(band)}`} aria-live="polite" className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-3 lg:gap-4 2xl:grid-cols-4">
            {shown.map((p, i) => (
              <li key={p.id} className={cn("budget-item", i >= 4 && "max-lg:hidden", i >= 6 && "lg:max-2xl:hidden")} style={{ ["--i" as string]: i }}>
                <DepositBox product={p} headingLevel={3} sizes="(min-width: 1024px) 280px, 45vw" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
