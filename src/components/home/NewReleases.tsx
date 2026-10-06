import { getTranslations } from "next-intl/server";
import { DepositBox } from "@/components/product/ProductCard";
import { TickBand } from "@/components/ui/Dial";
import { MERCH } from "@/config/merchandising";
import { ArrowLink, HomeHeading } from "./parts";
import type { HomeData } from "./types";

const CARD = 208;
const GAP = 20;
const PAD = 24;
const DAY = 86400000;
const HANG = 24;

function dayLabel(ms: number) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms));
}

export async function NewReleases({ releases }: { releases: HomeData["releases"] }) {
  if (releases.items.length < MERCH.releaseMinimum) return null;
  const t = await getTranslations("home.releases");
  const today = releases.now;
  const start = today - MERCH.releaseWindowDays * DAY;
  const items = [...releases.items].sort((a, b) => Date.parse(a.releaseDate) - Date.parse(b.releaseDate));
  const width = Math.max(1180, PAD * 2 + items.length * (CARD + GAP) + CARD);
  const span = width - PAD * 2 - CARD;
  const at = (ms: number) => PAD + CARD / 2 + ((ms - start) / (today - start)) * span;
  const anchors = items.map((r) => at(Date.parse(r.releaseDate)));
  const xs = anchors.map((a) => a - CARD / 2);
  for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i]!, xs[i - 1]! + CARD + GAP);
  const limit = width - PAD - CARD;
  if (xs.length) xs[xs.length - 1] = Math.min(xs[xs.length - 1]!, limit);
  for (let i = xs.length - 2; i >= 0; i--) xs[i] = Math.min(xs[i]!, xs[i + 1]! - CARD - GAP);
  for (let i = 0; i < xs.length; i++) xs[i] = Math.max(PAD, xs[i]!);
  const weekTicks = Array.from({ length: Math.round(MERCH.releaseWindowDays / 7) + 1 }, (_, i) => start + i * 7 * DAY);

  return (
    <section id="new-releases" aria-labelledby="new-releases-title" data-home-section="new-releases" className="bg-surface pb-16 pt-20 lg:pb-20 lg:pt-24">
      <div className="mx-auto flex max-w-wide flex-wrap items-end justify-between gap-x-10 gap-y-4 px-gutter">
        <div>
          <HomeHeading id="new-releases-title" title={t("title")} />
          <p className="m-0 mt-3 text-step-0 text-ink-muted">{t("lead")}</p>
        </div>
        <ArrowLink href="/new-releases">{t("all")}</ArrowLink>
      </div>
      <div data-pin="releases" className="relative mt-10 lg:mt-12">
        <div data-pin-sticky="">
        <div data-release-scroller="" data-pin-viewport="" role="region" className="no-scrollbar overflow-x-auto overscroll-x-contain" tabIndex={0} aria-label={t("rulerLabel", { count: releases.total, weeks: weekTicks.length - 1 })}>
          <div data-release-track="" data-pin-track="" className="relative mx-auto" style={{ width, maxWidth: "none" }}>
            <div aria-hidden="true" className="relative h-16">
              <div className="absolute inset-x-0 bottom-0 h-px bg-rule" style={{ left: PAD, right: PAD }} />
              <TickBand className="absolute bottom-px" major={false} />
              {weekTicks.map((w, i) => (
                <span key={w} className="absolute bottom-0 flex flex-col items-center" style={{ left: at(w) }}>
                  <span className="mb-2 -translate-x-1/2 whitespace-nowrap font-mono text-data-sm text-ink-muted">{i === weekTicks.length - 1 ? t("today") : dayLabel(w)}</span>
                  <span className={i === weekTicks.length - 1 ? "h-4 w-0.5 -translate-x-1/2 bg-brand" : "h-3 w-px -translate-x-1/2 bg-ink"} />
                </span>
              ))}
              {anchors.map((a, i) => (
                <span key={items[i]!.product.id} className="absolute bottom-0 h-2 w-px -translate-x-1/2 bg-ink-muted" style={{ left: a }} />
              ))}
            </div>
            <ol className="relative m-0 list-none p-0" style={{ height: "auto" }}>
              {items.map((r, i) => (
                <li key={r.product.id} className="absolute" style={{ left: xs[i], width: CARD, top: HANG }}>
                  <p className="m-0 mb-2 font-mono text-data-sm text-ink-muted">{t("released", { date: dayLabel(Date.parse(r.releaseDate)) })}</p>
                  <DepositBox product={r.product} headingLevel={3} sizes="208px" />
                </li>
              ))}
              <li aria-hidden="true" className="invisible" style={{ width: CARD, paddingTop: HANG }}>
                <p className="m-0 mb-2 font-mono text-data-sm">.</p>
                <DepositBox product={items[0]!.product} headingLevel={3} demo />
              </li>
            </ol>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
