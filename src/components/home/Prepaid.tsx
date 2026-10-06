import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SubscriptionTimetable } from "@/components/catalog/Prepaid";
import { platformInfo, regionTag } from "@/lib/catalog/platforms";
import type { GiftCardGroup, Timetable } from "@/lib/catalog/prepaid";
import { ArrowLink, HomeHeading } from "./parts";

function faceLabel(value: number | null, currency: string | null): string | null {
  if (value == null || !currency) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
}

function Blank({ group, cardLabel, valuesLabel }: { group: GiftCardGroup; cardLabel: string; valuesLabel: string }) {
  const p = platformInfo(group.platform);
  const values = group.products.filter((x) => x.value != null);
  const low = values[0] ? faceLabel(values[0].value, values[0].currency) : null;
  const high = values.length > 1 ? faceLabel(values[values.length - 1]!.value, values[values.length - 1]!.currency) : null;
  return (
    <article data-giftcard="" data-platform={p.tone} data-type="giftcard" className="plate relative flex aspect-[1.586/1] w-[78vw] max-w-[340px] shrink-0 snap-start flex-col justify-between overflow-hidden p-4 sm:w-auto sm:max-w-none">
      <div className="relative flex flex-col gap-1">
        <h3 className="m-0 flex min-w-0 items-center gap-2 font-sans text-[length:inherit] font-normal tracking-normal">
          <span aria-hidden="true" className="size-1.5 bg-platform" />
          <span className="eyebrow truncate text-ink">{p.short}</span>
        </h3>
        <span className="eyebrow whitespace-nowrap pl-3.5 text-type">{cardLabel}</span>
      </div>
      <ul className="relative m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={valuesLabel}>
        {group.products.slice(0, 4).map((x) => (
          <li key={x.id}>
            <Link href={`/product/${x.slug}`} className="inline-flex h-9 items-center border border-control bg-plate px-2.5 font-mono text-[0.8125rem] text-ink shadow-machined transition-colors duration-[120ms] hover-device:hover:border-ink hover-device:hover:bg-raised">
              {faceLabel(x.value, x.currency) ?? "—"}
            </Link>
          </li>
        ))}
        {group.products.length > 4 ? (
          <li>
            <Link href={`/catalog/gift-cards?platform=${encodeURIComponent(group.platform)}&region=${encodeURIComponent(group.region)}`} className="inline-flex h-9 items-center px-1.5 font-mono text-[0.8125rem] text-ink-muted underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline">
              +{group.products.length - 4}
            </Link>
          </li>
        ) : null}
      </ul>
      <div className="relative flex items-end justify-between gap-3">
        <span className="price text-step-3 leading-none text-ink">{low ? (high ? `${low}–${high}` : low) : ""}</span>
        <span className="font-mono text-[0.75rem] font-medium uppercase text-ink">{regionTag(group.region)}</span>
      </div>
    </article>
  );
}

export async function Prepaid({ giftCards, timetable }: { giftCards: GiftCardGroup[]; timetable: Timetable }) {
  const showGift = giftCards.length > 0;
  const showSubs = timetable.rows.length > 0;
  if (!showGift && !showSubs) return null;
  const t = await getTranslations("home.prepaid");
  return (
    <section id="prepaid" aria-label={`${t("giftTitle")} · ${t("subsTitle")}`} data-home-section="prepaid" className="bg-surface py-16 lg:py-24">
      <div className="mx-auto grid max-w-wide gap-x-6 gap-y-16 px-gutter lg:grid-cols-12">
        {showGift ? (
          <div className="min-w-0 lg:col-span-5">
            <HomeHeading id="gift-cards-title" title={t("giftTitle")} />
            <p className="m-0 mt-3 max-w-[46ch] text-step-0 leading-[1.55] text-ink-muted">{t("giftLead")}</p>
            <div className="no-scrollbar -mx-gutter mt-8 flex snap-x gap-3 overflow-x-auto px-gutter sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
              {giftCards.map((g) => {
                const p = platformInfo(g.platform);
                return <Blank key={g.key} group={g} cardLabel={t("giftCard")} valuesLabel={t("valuesLabel", { name: p.short, region: regionTag(g.region) })} />;
              })}
            </div>
            <ArrowLink href="/catalog/gift-cards" className="mt-5">
              {t("giftAll")}
            </ArrowLink>
          </div>
        ) : null}
        {showSubs ? (
          <div className={showGift ? "min-w-0 lg:col-span-6 lg:col-start-7 lg:pt-12" : "min-w-0 lg:col-span-12"}>
            <HomeHeading id="subscriptions-title" title={t("subsTitle")} />
            <p className="m-0 mt-3 max-w-[52ch] text-step-0 leading-[1.55] text-ink-muted">{t("subsLead")}</p>
            <div className="mt-8">
              <SubscriptionTimetable table={timetable} caption={t("subsCaption")} />
            </div>
            <ArrowLink href="/catalog/subscriptions" className="mt-5">
              {t("subsAll")}
            </ArrowLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
