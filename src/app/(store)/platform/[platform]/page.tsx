import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, platformBySlug, PRODUCT_TYPES, categorySlugFor } from "@/lib/keys/taxonomy";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface PlatformPageProps {
  params: Promise<{ platform: string }>;
  searchParams: Promise<RawSearchParams>;
}

async function platformStats(platform: string) {
  const rows = await prisma.keyItem.groupBy({
    by: ["productType"],
    where: { platform, product: { status: "ACTIVE" } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.productType, r._count._all]));
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
  return pageMetadata({ title, description, path: query.page > 1 ? `/platform/${platform.slug}?page=${query.page}` : `/platform/${platform.slug}`, canonical: !filtered, images: false, index: !filtered && total > 0 });
}

export default async function PlatformPage({ params, searchParams }: PlatformPageProps) {
  const { platform: slug } = await params;
  const platform = platformBySlug(slug);
  if (!platform) notFound();

  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const basePath = `/platform/${platform.slug}`;
  const [counts, result] = await Promise.all([platformStats(platform.key), queryCatalog({ kind: "platform", platform }, { ...query, category: null }, { basePath, defaultSort: "popular" })]);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0 && !hasActiveFilters(query)) notFound();

  const typeIndex = PRODUCT_TYPES.filter((type) => (counts.get(type.key) ?? 0) > 0).map((type) => ({
    slug: type.slug,
    label: type.label,
    count: counts.get(type.key) ?? 0,
    href: `/catalog/${categorySlugFor(type.key, platform.key)}`,
  }));
  const related = PLATFORMS.filter((p) => p.key !== platform.key && p.key !== "other")
    .slice(0, 4)
    .map((p) => ({ name: p.label, href: `/platform/${p.slug}` }));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("allCategoriesTitle"), href: "/catalog" }, { label: platform.label }]} />
      <CategoryOpener
        name={`${platform.label} keys`}
        count={total}
        lead={`Everything here activates on ${platform.label} and needs ${platform.account}. Check the activation region on each product before you buy.`}
        typeIndex={typeIndex}
        typeIndexLabel={`${platform.label} by product type`}
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
        related={related}
        headingId="platform-results"
        heading={t("resultsIn", { name: platform.label })}
      />
    </div>
  );
}
