import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CredentialsSheet } from "@/components/layout/Credentials/CredentialsSheet";
import { buttonClasses } from "@/components/ui/button-classes";
import { SplitWords } from "@/components/motion/SplitWords";
import { NAV_CATEGORIES } from "@/config/navigation";
import { BRAND } from "@/lib/brand";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return pageMetadata({
    title: t("metaTitle", { brand: BRAND.name }),
    description: t("metaDescription", { brand: BRAND.name, method: POLICY_FACTS.deliveryMethod }),
    path: "/about",
    absoluteTitle: true,
  });
}

const LISTING_KEYS = ["platform", "region", "edition", "prices"] as const;
const NOT_SOLD_KEYS = ["marketplace", "cases", "accounts", "other"] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");
  const f = POLICY_FACTS;

  const rows = [
    { key: "order", label: t("ordering.order.label"), text: t("ordering.order.body", { cardMethods: f.cardMethods, currencies: f.currencies }), href: "/policies/payment", link: t("ordering.order.link") },
    { key: "delivery", label: t("ordering.delivery.label"), text: t("ordering.delivery.body", { usual: f.deliveryUsual }), href: "/how-it-works", link: "How delivery works" },
    { key: "guarantee", label: t("ordering.guarantee.label"), text: t("ordering.guarantee.body", { claimDays: f.guaranteeClaimDays, refundDays: f.refundDays }), href: "/policies/warranty", link: t("ordering.guarantee.link") },
    { key: "withdrawal", label: t("ordering.withdrawal.label"), text: t("ordering.withdrawal.body", { days: f.withdrawalDays }), href: "/policies/returns", link: t("ordering.withdrawal.link") },
  ];

  return (
    <div data-page="about" className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("breadcrumbHome"), href: "/" }, { label: t("breadcrumb") }]} />

      <section aria-labelledby="about-title" data-section="about-hero" className="grid items-end gap-10 pb-20 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 id="about-title" data-anim="words" className="m-0 text-step-6 font-[680] leading-[0.96] tracking-[-0.01em] text-ink">
            <SplitWords text={t("hero.title")} />
          </h1>
          <p className="m-0 mt-6 max-w-[60ch] text-step-1 leading-[1.5] text-ink-muted">{t("hero.lead", { brand: BRAND.name, countries: f.marketCountries })}</p>
        </div>
      </section>

      <section aria-labelledby="range-title" data-section="about-range" className="grid gap-10 border-t border-line py-16 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 id="range-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
            {t("range.title")}
          </h2>
          <p className="m-0 text-ui-md text-ink-muted">{t("range.body")}</p>
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {NAV_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalog/${c.slug}`} className="label-caps text-[0.9375rem] text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="m-0 text-step-2 font-semibold leading-[1.12] text-ink">{t("listing.title")}</h2>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0 text-step-0 text-ink-muted [&>li]:border-b [&>li]:border-line [&>li]:py-2.5">
            {LISTING_KEYS.map((key) => (
              <li key={key}>{t(`listing.${key}`, { currencies: f.currencies })}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="not-sold-title" data-section="about-not-sold" className="border-t border-line py-16">
        <h2 id="not-sold-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
          {t("notSold.title")}
        </h2>
        <ul className="measure m-0 mt-6 flex list-none flex-col border-t border-line p-0 text-step-0 text-ink-muted [&>li]:border-b [&>li]:border-line [&>li]:py-2.5">
          {NOT_SOLD_KEYS.map((key) => (
            <li key={key}>{t(`notSold.items.${key}`, { brand: BRAND.name })}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ordering-title" data-section="about-ordering" className="border-t border-line py-16">
        <h2 id="ordering-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
          {t("ordering.title")}
        </h2>
        <dl className="m-0 mt-8 border-t border-line">
          {rows.map((row) => (
            <div key={row.key} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8">
              <dt className="eyebrow">{row.label}</dt>
              <dd className="measure m-0 text-step-0 text-ink">
                {row.text}{" "}
                <Link href={row.href} className="font-semibold underline decoration-1 underline-offset-4">
                  {row.link}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="company-title" data-section="about-company" className="border-t border-line py-16">
        <h2 id="company-title" className="m-0 mb-6 text-step-3 font-semibold leading-[1.1] text-ink">
          {t("company.title")}
        </h2>
        <CredentialsSheet />
        <div className="mt-10">
          <Link href="/catalog" className={buttonClasses({ size: "lg" })}>
            {t("browse")}
          </Link>
        </div>
      </section>
    </div>
  );
}
