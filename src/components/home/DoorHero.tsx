import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchForm } from "@/components/search/SearchResults/SearchResults";
import { Cover } from "@/components/product/Cover";
import { Tumbler } from "@/components/ui/Tumbler";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import { DoorPoster } from "./DoorPoster";
import { PlatformPlates } from "./parts";
import type { CoverRef, HomeData } from "./types";

function syncLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
  if (Date.now() - d.getTime() < 48 * 3600 * 1000) return `${time} UTC`;
  return `${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(d)}, ${time} UTC`;
}

export function DoorContents({ covers, label, className, mobileLimit = 6, parallax = false }: { covers: CoverRef[]; label: string; className?: string; mobileLimit?: number; parallax?: boolean }) {
  return (
    <ul data-door-contents="" data-door-covers={parallax ? "" : undefined} aria-label={label} className={cn("door-contents m-0 list-none p-0", className)}>
      {covers.map((c, i) => (
        <li key={c.id} className={cn(i >= mobileLimit && "max-lg:hidden")}>
          <Link href={`/product/${c.slug}`} aria-label={c.title} className="block">
            <Cover src={c.image} alt="" sizes="(min-width: 1024px) 110px, 26vw" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Readout({ value, label, text }: { value: string | number; label: string; text: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-line px-4 py-3 max-sm:[&:nth-child(odd)]:border-r max-sm:[&:nth-child(n+3)]:border-t sm:border-l sm:first:border-l-0">
      <dt className="eyebrow order-2 text-[0.6875rem] sm:text-[0.75rem]">{label}</dt>
      <dd className="m-0 order-1">
        <Tumbler value={value} label={text} size="md" motion />
      </dd>
    </div>
  );
}

export async function DoorHero({ data }: { data: HomeData }) {
  const t = await getTranslations("home.door");
  const lead = [t("leadCatalogue"), STORE_POLICY.payment.hostedPage && STORE_POLICY.payment.threeDSecure ? t("leadPayment") : null, t("leadDelivery")].filter(Boolean).join(" ");
  const synced = syncLabel(data.syncedAt);
  const readouts = [
    data.live > 0 ? { key: "live", value: data.live, label: t("inStock"), text: `${data.live.toLocaleString("en-GB")} ${t("inStock").toLowerCase()}` } : null,
    data.platforms.length > 0 ? { key: "platforms", value: data.platforms.length, label: t("platforms"), text: `${data.platforms.length} ${t("platforms").toLowerCase()}` } : null,
    data.onSale > 0 ? { key: "sale", value: data.onSale, label: t("onSale"), text: `${data.onSale.toLocaleString("en-GB")} ${t("onSale").toLowerCase()}` } : null,
    synced ? { key: "sync", value: synced.replace(" UTC", ""), label: t("updatedUtc"), text: `${t("updated")} ${synced}` } : null,
  ].filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <section id="door" aria-labelledby="door-title" data-scene="vault-door" data-home-section="door" className="relative overflow-hidden bg-surface">
      <div data-depth="D0" className="door-wall" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-wide gap-x-10 gap-y-10 px-gutter pb-12 pt-8 lg:min-h-[calc(100svh-var(--header-height))] lg:grid-cols-12 lg:items-center lg:py-12">
        <div className="min-w-0 lg:col-span-6">
          <p className="eyebrow m-0">{t("eyebrow")}</p>
          <h1 id="door-title" className="m-0 mt-5 max-w-[12ch] text-display-xl leading-[0.92] tracking-[-0.02em] text-ink [font-weight:760]">
            {t("title")}
          </h1>
          <p className="m-0 mt-6 max-w-[54ch] text-step-1 leading-[1.5] text-ink-muted">{lead}</p>
          <div className="mt-8 max-w-[620px] max-sm:[&_button]:px-4 max-sm:[&_input]:pr-2">
            <SearchForm query="" inputId="door-search" label={t("searchLabel")} placeholder={t("searchPlaceholder", { count: data.live.toLocaleString("en-GB") })} submit={t("searchSubmit")} />
          </div>
          <PlatformPlates platforms={data.platforms.slice(0, 6)} label={t("platformsLabel")} scroller className="mt-4 max-w-[620px]" />
          {readouts.length ? (
            <dl aria-label={t("readoutLabel")} data-depth="D4" data-tumbler-group="" className="plate m-0 mt-8 grid max-w-[620px] grid-cols-2 sm:grid-cols-4 max-lg:hidden">
              {readouts.map((r) => (
                <Readout key={r.key} value={r.value} label={r.label} text={r.text} />
              ))}
            </dl>
          ) : null}
        </div>
        <div className="relative min-w-0 lg:col-span-6">
          <div data-door="" className="door-stage">
            <DoorPoster uid="hero-door" label={t("posterLabel")} interior={<DoorContents covers={data.doorCovers} label={t("contentsLabel")} />} />
            <div data-vault-door="" data-vault-canvas="" aria-hidden="true" className="door-canvas" />
          </div>
        </div>
        {readouts.length ? (
          <dl aria-label={t("readoutLabel")} className="plate m-0 grid grid-cols-2 lg:hidden">
            {readouts.map((r) => (
              <Readout key={r.key} value={r.value} label={r.label} text={r.text} />
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
