import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { RARITIES, raritySlug } from "@/lib/skins/cs2";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { categoryCounts, categoryStats, getCategoryTree, queryCatalog, type CategoryRecord, type CategoryTree } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
}

function chainOf(tree: CategoryTree, category: CategoryRecord): CategoryRecord[] {
  const chain: CategoryRecord[] = [];
  let current: CategoryRecord | undefined = category;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? tree.byId.get(current.parentId) : undefined;
  }
  return chain;
}

function relatedRoots(tree: CategoryTree, counts: Map<string, number>, root: CategoryRecord) {
  return tree.roots.filter((c) => c.id !== root.id && (counts.get(c.id) ?? 0) > 0).slice(0, 3);
}

async function rarityCounts(categoryIds: string[]) {
  const rows = await prisma.skin.groupBy({
    by: ["rarity"],
    where: { product: { status: "ACTIVE", categories: { some: { categoryId: { in: categoryIds } } } } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.rarity, r._count._all]));
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: true } };
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams);
  const stats = await categoryStats(tree.subtreeIds(category.id));
  const chain = chainOf(tree, category);
  const title = chain.length > 1 ? `${category.name} — ${chain[0].name}` : category.name;
  const pagedTitle = query.page > 1 ? t("titleWithPage", { title, page: query.page }) : title;
  const lead = category.description || t("metaCategoryFallback", { name: category.name });
  const description = pagedDescription(`${lead} ${t("metaCategoryCount", { count: stats.count })}`, query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(query);
  return pageMetadata({
    title: pagedTitle,
    description,
    path: query.page > 1 ? `/catalog/${category.slug}?page=${query.page}` : `/catalog/${category.slug}`,
    canonical: !filtered,
    images: false,
    index: !filtered && stats.count > 0,
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug);
  if (!category) notFound();

  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams);
  const basePath = `/catalog/${category.slug}`;
  const chain = chainOf(tree, category);
  const root = chain[0];
  const parent = category.parentId ? tree.byId.get(category.parentId) ?? null : null;
  const anchor = parent ?? category;

  const [counts, stats, result, tiers] = await Promise.all([
    categoryCounts(tree),
    categoryStats(tree.subtreeIds(category.id)),
    queryCatalog({ kind: "category", category }, { ...query, category: null }, { basePath }),
    parent ? rarityCounts(tree.subtreeIds(category.id)) : Promise.resolve(new Map<string, number>()),
  ]);

  const index = tree
    .children(anchor.id)
    .map((c) => ({ slug: c.slug, label: c.name, count: counts.get(c.id) ?? 0, href: `/catalog/${c.slug}`, active: c.id === category.id }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const rarities = parent
    ? RARITIES.map((r) => ({ key: r.key, slug: raritySlug(r.key), label: r.label, count: tiers.get(r.key) ?? 0, href: `${basePath}?rarity=${r.key}` })).filter((r) => r.count > 0)
    : [];

  const related = relatedRoots(tree, counts, root).map((c) => ({ name: c.name, href: `/catalog/${c.slug}` }));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          { label: "All skins", href: "/catalog" },
          ...chain.slice(0, -1).map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })),
          { label: category.name },
        ]}
      />
      <CategoryOpener
        name={category.name}
        count={stats.count}
        lead={category.description}
        minPrice={stats.minPrice}
        maxPrice={stats.maxPrice}
        index={parent ? [] : index}
        indexLabel={`${category.name} by weapon`}
        rarities={rarities}
      />
      <CatalogBrowser
        basePath={basePath}
        params={{ ...query, category: null, page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        related={related}
        headingId="category-results"
        heading={t("resultsIn", { name: category.name })}
      />
    </div>
  );
}
