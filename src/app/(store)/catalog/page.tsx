import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { categoryCounts, getCategoryTree, queryCatalog } from "@/components/catalog/catalog-query";
import { buildCatalogHref, hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface CatalogPageProps {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const params = parseCatalogParams(await searchParams);
  const tree = await getCategoryTree();
  const counts = await categoryCounts(tree);
  const total = tree.roots.reduce((sum, c) => sum + (counts.get(c.id) ?? 0), 0);
  const seo = await getTranslations("seo");
  const title = params.page > 1 ? t("titleWithPage", { title: seo("catalogTitle"), page: params.page }) : seo("catalogTitle");
  const description = pagedDescription(t("metaCatalogDescription", { count: total }), params.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(params);
  return pageMetadata({
    title,
    description,
    path: params.page > 1 ? `/catalog?page=${params.page}` : "/catalog",
    canonical: !filtered,
    index: !filtered,
  });
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const tree = await getCategoryTree();

  if (params.category) {
    const target = tree.bySlug.get(params.category);
    if (target) redirect(buildCatalogHref(`/catalog/${target.slug}`, { ...params, category: null }, {}, { resetPage: false }));
  }

  const t = await getTranslations("catalog");
  const counts = await categoryCounts(tree);
  const result = await queryCatalog({ kind: "all" }, { ...params, category: null }, { basePath: "/catalog" });
  const typeIndex = tree.roots
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .map((c) => ({ slug: c.slug, label: c.name, count: counts.get(c.id) ?? 0, href: `/catalog/${c.slug}` }));
  const total = tree.roots.reduce((sum, c) => sum + (counts.get(c.id) ?? 0), 0);

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: "All skins" }]} />
      <CategoryOpener
        name="All CS2 skins"
        count={total}
        lead={`Knives, gloves and weapon skins across ${typeIndex.length} weapon types. Every listing is one item in one exterior, with its price shown up front.`}
        typeIndex={typeIndex}
      />

      <CatalogBrowser
        basePath="/catalog"
        params={{ ...params, category: null, page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        related={typeIndex.slice(0, 3).map((d) => ({ name: d.label, href: d.href }))}
        headingId="catalog-results"
        heading={t("resultsHeading")}
      />
    </div>
  );
}
