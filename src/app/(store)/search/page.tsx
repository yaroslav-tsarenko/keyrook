import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { categoryCounts, getCategoryTree, queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams, type SortKey } from "@/components/catalog/catalog-url";
import { SearchForm, SearchNoResults } from "@/components/search/SearchResults/SearchResults";
import { noindexMetadata } from "@/lib/seo/metadata";

interface SearchPageProps {
  searchParams: Promise<RawSearchParams>;
}

const SEARCH_SORTS: SortKey[] = ["relevance", "price-asc", "price-desc", "rarity-desc", "newest", "name-asc"];

function readQuery(raw: RawSearchParams): string {
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  return (q ?? "").trim().slice(0, 100);
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const query = readQuery(await searchParams);
  return noindexMetadata(query ? t("metaSearchQuery", { query }) : t("searchTitle"), t("metaSearchDescription"), "/search");
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const query = readQuery(raw);
  const params = parseCatalogParams(raw, "relevance");
  const t = await getTranslations("catalog");
  const tree = await getCategoryTree();
  const counts = await categoryCounts(tree);
  const categoryLinks = tree.roots
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .map((c) => ({ name: c.name, href: `/catalog/${c.slug}`, count: counts.get(c.id) ?? 0 }));

  const searchable = query.length >= 2;
  const result = searchable ? await queryCatalog({ kind: "search", query }, params, { basePath: "/search", fixed: { q: query }, defaultSort: "relevance" }) : null;
  const showBrowser = result && (result.scopeTotal > 0 || hasActiveFilters(params));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("searchTitle") }]} />
      <div className="max-w-[760px] pb-8 pt-1">
        <SearchForm query={query} label={t("searchLabel")} placeholder={t("searchPlaceholder")} submit={t("searchSubmit")} />
      </div>

      <header className="pb-8">
        <h1 className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">
          {searchable ? t("queryHeading", { query }) : t("searchTitle")}
          {result ? <span className="font-mono text-data font-normal tracking-normal text-ink-muted">{result.scopeTotal.toLocaleString("en-GB")}</span> : null}
        </h1>
        {result && result.facets.weapons.length > 0 ? (
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
            {result.facets.weapons
              .filter((w) => w.count > 0)
              .slice(0, 8)
              .map((w) => (
                <li key={w.key}>
                  <a href={`/search?q=${encodeURIComponent(query)}&weapon=${w.key}`} className="inline-flex min-h-9 items-baseline gap-1.5 font-display text-[0.9375rem] font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                    {w.label}
                    <span className="font-mono text-[0.75rem] font-normal text-ink-subtle">· {w.count}</span>
                  </a>
                </li>
              ))}
          </ul>
        ) : null}
      </header>

      {showBrowser && result ? (
        <CatalogBrowser
          basePath="/search"
          fixed={{ q: query }}
          defaultSort="relevance"
          sortOptions={SEARCH_SORTS}
          params={{ ...params, page: result.page }}
          products={result.products}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          facets={result.facets}
          activeCategoryName={result.activeCategoryName}
          related={categoryLinks.slice(0, 3)}
          headingId="search-results"
          heading={t("resultsHeading")}
        />
      ) : (
        <SearchNoResults query={searchable ? query : ""} categories={categoryLinks} />
      )}
    </div>
  );
}
