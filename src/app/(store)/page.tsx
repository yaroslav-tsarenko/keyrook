import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { getHomeData } from "@/components/home/data";
import { ProductRail } from "@/components/product/ProductRail";
import { SearchForm } from "@/components/search/SearchResults/SearchResults";
import { Tumbler } from "@/components/ui/Tumbler";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { platformInfo } from "@/lib/catalog/platforms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return pageMetadata({ title: t("metaTitle", { brand: BRAND.name }), description: t("metaDescription", { brand: BRAND.name }), path: "/", absoluteTitle: true });
}

const SECTIONS = [
  { id: "security-strip", title: "Security strip" },
  { id: "platform-vault", title: "Pick your platform" },
  { id: "price-cuts", title: "Price cuts" },
  { id: "theater", title: "Watch a key leave the vault" },
  { id: "genres", title: "Browse by genre" },
  { id: "new-releases", title: "New releases" },
  { id: "prepaid", title: "Gift cards & subscriptions" },
  { id: "activation", title: "How activation works" },
  { id: "ledger", title: "What's in the vault, and what never is" },
  { id: "budget", title: "Set a budget" },
  { id: "questions", title: "Questions" },
  { id: "door-open", title: "The door's open." },
] as const;

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div data-landing="home" data-home-skeleton="">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <section id="door" data-home-section="door" className="mx-auto grid max-w-wide gap-10 px-gutter pb-16 pt-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow m-0">Game key store</p>
          <h1 className="m-0 mt-4 text-display-xl leading-[0.92] tracking-[-0.02em] [font-weight:760]">Game keys, kept under lock until they&apos;re yours.</h1>
          <div className="mt-8 max-w-[620px]">
            <SearchForm query="" label="Search keys" placeholder={`Search ${data.totalProducts.toLocaleString("en-GB")} keys`} submit="Search" />
          </div>
          <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {data.platforms.slice(0, 6).map((p) => (
              <li key={p.key} data-platform={platformInfo(p.key).tone}>
                <Link href={p.href} className="inline-flex min-h-10 items-center gap-2">
                  <span aria-hidden="true" className="size-1.5 bg-platform" />
                  <span className="eyebrow text-ink">{platformInfo(p.key).short}</span>
                  <span className="font-mono text-[0.75rem] text-ink-muted">{p.count.toLocaleString("en-GB")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-8 flex items-center gap-3">
            <Tumbler value={data.totalProducts} label={`${data.totalProducts.toLocaleString("en-GB")} keys in stock`} size="md" />
            <span className="eyebrow">Keys in stock</span>
          </p>
        </div>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} data-home-section={s.id} className="mx-auto max-w-wide border-t border-line px-gutter py-12">
          {s.id === "price-cuts" && data.drops.length ? (
            <ProductRail id="home-drops" title={s.title} products={data.drops} />
          ) : s.id === "new-releases" && data.releases.length ? (
            <ProductRail id="home-releases" title={s.title} products={data.releases} />
          ) : (
            <h2 id={`${s.id}-title`} className="m-0 text-step-4 leading-[1.06] text-ink">
              {s.title}
            </h2>
          )}
        </section>
      ))}
    </div>
  );
}
