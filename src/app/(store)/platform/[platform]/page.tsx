import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, platformBySlug, PRODUCT_TYPES, categorySlugFor } from "@/lib/keys/taxonomy";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { PlatformOpener } from "@/components/catalog/CategoryOpener";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { platformInfo } from "@/lib/catalog/platforms";
import { activationFor } from "@/config/activation";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface PlatformPageProps {
  params: Promise<{ platform: string }>;
  searchParams: Promise<RawSearchParams>;
}

async function platformStats(platform: string) {
  const rows = await prisma.keyItem.groupBy({
    by: ["productType"],
    where: { platform, product: { status: "ACTIVE", quantity: { gt: 0 } } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.productType, r._count._all]));
}

async function platformMinPrice(platform: string): Promise<number | null> {
  const row = await prisma.product.aggregate({ where: { status: "ACTIVE", quantity: { gt: 0 }, item: { platform } }, _min: { price: true } });
  return row._min.price != null ? Number(row._min.price) : null;
}

export async function generateMetadata({ params, searchParams }: PlatformPageProps): Promise<Metadata> {
  const { platform: slug } = await params;
  const platform = platformBySlug(slug);
  if (!platform) return { title: "Platform not found", robots: { index: false, follow: true } };
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const counts = await platformStats(platform.key);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const title = query.page > 1 ? t("titleWithPage", { title: `${platform.label} keys`, page: query.page }) : `${platform.label} keys`;
  const description = pagedDescription(`Games, DLC and other products that activate on ${platform.label}: ${total} products, each with its activation region and languages listed.`, query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(query);
  return pageMetadata({ title, description, path: query.page > 1 ? `/platform/${platform.slug}?page=${query.page}` : `/platform/${platform.slug}`, canonical: !filtered, index: !filtered && total > 0 });
}

export default async function PlatformPage({ params, searchParams }: PlatformPageProps) {
  const { platform: slug } = await params;
  const platform = platformBySlug(slug);
  if (!platform) notFound();

  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const basePath = `/platform/${platform.slug}`;
  const info = platformInfo(platform.key);
  const guide = activationFor(platform.key);
  const [counts, minPrice, result] = await Promise.all([platformStats(platform.key), platformMinPrice(platform.key), queryCatalog({ kind: "platform", platform }, { ...query, category: null }, { basePath, defaultSort: "popular" })]);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  const typeIndex = PRODUCT_TYPES.filter((type) => (counts.get(type.key) ?? 0) > 0).map((type) => ({
    slug: type.slug,
    label: type.key === "dlc" ? "DLC" : type.label,
    count: counts.get(type.key) ?? 0,
    href: `/catalog/${categorySlugFor(type.key, platform.key)}`,
  }));
  const others = await prisma.keyItem.groupBy({ by: ["platform"], where: { product: { status: "ACTIVE", quantity: { gt: 0 } }, platform: { not: platform.key } }, _count: { _all: true } });
  const related = PLATFORMS.filter((p) => p.key !== "other" && others.some((o) => o.platform === p.key)).map((p) => ({ name: platformInfo(p.key).short, href: `/platform/${p.slug}` }));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: "Catalogue", href: "/catalog" }, { label: info.short }]} />
      {total === 0 && !hasActiveFilters(query) ? (
        <EmptyState title={`No ${info.short} keys in stock right now`} subtitle="Try another platform's locker." headingLevel={1}>
          <ul className="m-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0">
            {related.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="text-ui-md font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                  {r.name}
                </a>
              </li>
            ))}
          </ul>
        </EmptyState>
      ) : (
        <>
          <PlatformOpener
            name={`${info.short} keys`}
            count={total}
            minPrice={minPrice}
            sentence={guide?.sentence ?? `Activates on ${platform.label}. You need ${platform.account}.`}
            guideHref={guide ? `/how-activation-works#${platform.slug}` : null}
            guideLabel={`How to redeem on ${info.short}`}
            typeIndex={typeIndex}
            tone={info.tone}
          />
          <CatalogBrowser
            basePath={basePath}
            params={{ ...query, category: null, page: result.page }}
            products={result.products}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            facets={result.facets}
            defaultSort="popular"
            related={related.slice(0, 4)}
            headingId="platform-results"
            heading={t("resultsIn", { name: platform.label })}
            hide={["platforms"]}
            feature={query.sort === "popular" ? result.products[0] ?? null : null}
          />
        </>
      )}
    </div>
  );
}
