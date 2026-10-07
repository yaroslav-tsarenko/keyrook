import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { stockedPlatformCounts } from "@/lib/catalog/live-stock";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams, type SortKey } from "@/components/catalog/catalog-url";
import { SearchForm, SearchNoResults } from "@/components/search/SearchResults/SearchResults";
import { Tumbler } from "@/components/ui/Tumbler";
import { platformInfo } from "@/lib/catalog/platforms";
import { noindexMetadata } from "@/lib/seo/metadata";

interface SearchPageProps {
  searchParams: Promise<RawSearchParams>;
}

const SEARCH_SORTS: SortKey[] = ["relevance", "price-asc", "price-desc", "discount", "release-desc", "newest", "name-asc"];

function readQuery(raw: RawSearchParams): string {
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  return (q ?? "").trim().slice(0, 100);
}

async function platformLockers() {
  return (await stockedPlatformCounts())
    .filter((r) => r.platform !== "other")
    .map((r) => {
      const info = platformInfo(r.platform);
      return { name: info.short, href: `/platform/${info.slug}`, count: r.count, tone: info.tone };
    });
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
  const lockers = await platformLockers();

  const searchable = query.length >= 2;
  const result = searchable ? await queryCatalog({ kind: "search", query }, params, { basePath: "/search", fixed: { q: query }, defaultSort: "relevance" }) : null;
  const showBrowser = result && (result.scopeTotal > 0 || hasActiveFilters(params));
  const genreMatches = result ? result.facets.genres.filter((g) => g.count > 0).slice(0, 6) : [];

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("searchTitle") }]} />
      <div className="max-w-[760px] pb-8 pt-1">
        <SearchForm query={query} label={t("searchLabel")} placeholder={t("searchPlaceholder")} submit={t("searchSubmit")} />
      </div>

      <header className="pb-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="m-0 text-step-5 leading-[1.04] text-ink [overflow-wrap:anywhere]">{searchable ? t("queryHeading", { query }) : t("searchTitle")}</h1>
          {result ? <Tumbler value={result.scopeTotal} size="sm" label={`${result.scopeTotal.toLocaleString("en-GB")} results`} /> : null}
        </div>
        {result && (result.facets.platforms.length > 1 || genreMatches.length) ? (
          <div className="mt-5 flex flex-col gap-2">
            {result.facets.platforms.length > 1 ? (
              <ul className="m-0 flex list-none flex-wrap items-baseline gap-x-5 gap-y-1 p-0">
                <li className="eyebrow mr-1">Platforms</li>
                {result.facets.platforms
                  .filter((w) => w.count > 0)
                  .slice(0, 8)
                  .map((w) => (
                    <li key={w.key} data-platform={platformInfo(w.key).tone}>
                      <Link href={`/search?q=${encodeURIComponent(query)}&platform=${w.key}`} className="inline-flex min-h-9 items-center gap-2 text-ui-md text-ink underline-offset-4 hover-device:hover:underline">
                        <span aria-hidden="true" className="size-1.5 bg-platform" />
                        {platformInfo(w.key).short}
                        <span className="font-mono text-[0.75rem] text-ink-muted">· {w.count.toLocaleString("en-GB")}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : null}
            {genreMatches.length ? (
              <ul className="m-0 flex list-none flex-wrap items-baseline gap-x-5 gap-y-1 p-0">
                <li className="eyebrow mr-1">Genres</li>
                {genreMatches.map((g) => (
                  <li key={g.key}>
                    <Link href={`/search?q=${encodeURIComponent(query)}&genre=${g.key}`} className="inline-flex min-h-9 items-center gap-2 text-ui-md text-ink underline-offset-4 hover-device:hover:underline">
                      {g.label}
                      <span className="font-mono text-[0.75rem] text-ink-muted">· {g.count.toLocaleString("en-GB")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
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
          related={lockers.slice(0, 3).map((l) => ({ name: l.name, href: l.href }))}
          headingId="search-results"
          heading={t("resultsHeading")}
        />
      ) : (
        <SearchNoResults query={searchable ? query : ""} platforms={lockers.slice(0, 9)} />
      )}
    </div>
  );
}
