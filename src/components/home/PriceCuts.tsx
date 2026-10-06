import { getTranslations } from "next-intl/server";
import { FeatureBox } from "@/components/product/ProductCard";
import { MERCH } from "@/config/merchandising";
import { STORE_POLICY } from "@/config/store-policy";
import { DealRail } from "./DealRail";
import { ArrowLink, HomeHeading } from "./parts";
import type { HomeData } from "./types";

export async function PriceCuts({ deals }: { deals: HomeData["deals"] }) {
  const count = deals.rail.length + (deals.feature ? 1 : 0);
  if (count < MERCH.dealMinimum) return null;
  const t = await getTranslations("home.deals");
  return (
    <section id="price-cuts" aria-labelledby="price-cuts-title" data-home-section="price-cuts" className="bg-surface-1 py-16 lg:py-20">
      <div className="mx-auto grid max-w-wide gap-x-6 gap-y-8 px-gutter lg:grid-cols-12">
        <div className="lg:col-span-3 lg:pr-4">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <HomeHeading id="price-cuts-title" title={t("title")} />
            <p className="m-0 mt-4 text-ui-md leading-[1.55] text-ink-muted">{t("lead", { days: STORE_POLICY.deals.compareWindowDays })}</p>
            <ArrowLink href="/deals" className="mt-4">
              {t("all", { count: deals.total.toLocaleString("en-GB") })}
            </ArrowLink>
          </div>
        </div>
        {deals.feature ? (
          <div className="min-w-0 lg:col-span-5">
            <FeatureBox product={deals.feature} headingLevel={3} />
          </div>
        ) : null}
        <div className={deals.feature ? "min-w-0 lg:col-span-4" : "min-w-0 lg:col-span-9"}>
          <DealRail products={deals.rail} labels={{ rail: t("railLabel"), previous: t("previous"), next: t("next"), position: t.raw("position") as string }} />
        </div>
      </div>
    </section>
  );
}
