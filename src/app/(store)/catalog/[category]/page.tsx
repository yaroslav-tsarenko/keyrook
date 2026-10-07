import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { categoryCounts, categoryStats, getCategoryTree, queryCatalog, type CategoryRecord, type CategoryTree } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";
import { GiftCardShelf, SubscriptionTimetable } from "@/components/catalog/Prepaid";
import { giftCardGroups, subscriptionTimetable } from "@/lib/catalog/prepaid";
import { platformBySlug } from "@/lib/keys/taxonomy";
import { platformInfo } from "@/lib/catalog/platforms";

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

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: true } };
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const stats = await categoryStats(tree.subtreeIds(category.id));
  const chain = chainOf(tree, category);
  const title = chain.length > 1 ? `${chain[0].name} for ${category.name}` : category.name;
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
  const query = parseCatalogParams(await searchParams, "popular");
  const basePath = `/catalog/${category.slug}`;
  const chain = chainOf(tree, category);
  const root = chain[0];
  const parent = category.parentId ? tree.byId.get(category.parentId) ?? null : null;
  const anchor = parent ?? category;

  const [counts, stats, result] = await Promise.all([
    categoryCounts(tree),
    categoryStats(tree.subtreeIds(category.id)),
    queryCatalog({ kind: "category", category }, { ...query, category: null }, { basePath, defaultSort: "popular" }),
  ]);

  const index = tree
    .children(anchor.id)
    .map((c) => {
      const platformSlug = c.slug.slice(anchor.slug.length + 1);
      const platformKey = platformBySlug(platformSlug)?.key ?? null;
      return { slug: c.slug, label: c.name, count: counts.get(c.id) ?? 0, href: `/catalog/${c.slug}`, active: c.id === category.id, platform: platformKey ? platformInfo(platformKey).tone : null };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const related = relatedRoots(tree, counts, root).map((c) => ({ name: c.name, href: `/catalog/${c.slug}` }));
  const rootOnly = !parent && !hasActiveFilters(query) && query.page === 1;
  const [timetable, giftGroups] = await Promise.all([
    rootOnly && root.slug === "subscriptions" ? subscriptionTimetable(60) : Promise.resolve(null),
    rootOnly && root.slug === "gift-cards" ? giftCardGroups() : Promise.resolve(null),
  ]);
  const icon = root.slug === "dlc" || root.slug === "gift-cards" || root.slug === "subscriptions" ? (root.slug as "dlc" | "gift-cards" | "subscriptions") : null;
  const title = parent ? `${parent.slug === "dlc" ? "DLC" : parent.name} for ${category.name}` : category.slug === "dlc" ? "DLC" : category.name;

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          { label: "Catalogue", href: "/catalog" },
          ...chain.slice(0, -1).map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })),
          { label: category.name },
        ]}
      />
      <CategoryOpener
        name={title}
        count={stats.count}
        lead={parent ? parent.description : category.description}
        note={root.slug === "dlc" ? <p className="m-0 text-ui-md text-ink">DLC needs the base game on the same platform and region.</p> : null}
        icon={icon}
        index={index}
        indexLabel={`${anchor.slug === "dlc" ? "DLC" : anchor.name} by platform`}
      />
      {timetable && timetable.rows.length ? (
        <section aria-labelledby="timetable-title" className="mb-14">
          <h2 id="timetable-title" className="m-0 mb-4 text-step-3 leading-[1.1] text-ink">
            Durations and prices
          </h2>
          <SubscriptionTimetable table={timetable} caption="Subscription prices by service and duration" />
        </section>
      ) : null}
      {giftGroups && giftGroups.length ? (
        <section aria-labelledby="blanks-title" className="mb-14">
          <h2 id="blanks-title" className="m-0 mb-2 text-step-3 leading-[1.1] text-ink">
            Card values by platform
          </h2>
          <p className="m-0 mb-6 text-ui-md text-ink-muted">Check the card’s region before you buy. A card adds balance only to an account set to that region.</p>
          <GiftCardShelf groups={giftGroups} />
        </section>
      ) : null}
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
        headingId="category-results"
        heading={t("resultsIn", { name: category.name })}
        hide={["types", ...(parent ? (["platforms"] as const) : [])]}
      />
    </div>
  );
}
