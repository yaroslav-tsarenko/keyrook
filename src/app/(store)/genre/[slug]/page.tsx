import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { GENRES, PLATFORMS, genreDef } from "@/lib/keys/taxonomy";
import { platformInfo } from "@/lib/catalog/platforms";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { buildCatalogHref, hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

async function genrePlatforms(genre: string) {
  const rows = await prisma.keyItem.groupBy({ by: ["platform"], where: { genres: { has: genre }, product: { status: "ACTIVE", quantity: { gt: 0 } } }, _count: { _all: true } });
  return rows.map((r) => ({ platform: r.platform, count: r._count._all })).sort((a, b) => b.count - a.count);
}

export async function generateMetadata({ params, searchParams }: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = genreDef(slug);
  if (!genre) return { title: "Genre not found", robots: { index: false, follow: true } };
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const counts = await genrePlatforms(genre.key);
  const total = counts.reduce((a, b) => a + b.count, 0);
  const title = query.page > 1 ? t("titleWithPage", { title: `${genre.label} game keys`, page: query.page }) : `${genre.label} game keys`;
  const description = pagedDescription(`${genre.label} games and DLC for Steam, Xbox, PlayStation and more: ${total} keys in stock, each with its platform, region and languages listed.`, query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(query);
  return pageMetadata({ title, description, path: query.page > 1 ? `/genre/${genre.key}?page=${query.page}` : `/genre/${genre.key}`, canonical: !filtered, index: !filtered && total > 0 });
}

export function generateStaticParams() {
  return GENRES.map((g) => ({ slug: g.key }));
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
  const { slug } = await params;
  const genre = genreDef(slug);
  if (!genre) notFound();
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "popular");
  const basePath = `/genre/${genre.key}`;
  const [counts, result] = await Promise.all([genrePlatforms(genre.key), queryCatalog({ kind: "genre", genre }, { ...query, category: null, genres: [] }, { basePath, defaultSort: "popular" })]);
  const total = counts.reduce((a, b) => a + b.count, 0);
  const index = counts
    .filter((c) => PLATFORMS.some((p) => p.key === c.platform))
    .map((c) => {
      const info = platformInfo(c.platform);
      return { slug: c.platform, label: info.short, count: c.count, href: buildCatalogHref(basePath, { ...query, genres: [] }, { platforms: [c.platform] }, { defaultSort: "popular" }), platform: info.tone, active: query.platforms.length === 1 && query.platforms[0] === c.platform };
    });
  const others = GENRES.filter((g) => g.key !== genre.key)
    .slice(0, 4)
    .map((g) => ({ name: g.label, href: `/genre/${g.key}` }));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: "Catalogue", href: "/catalog" }, { label: genre.label }]} />
      <CategoryOpener name={genre.label} count={total} lead={`${genre.label} games and DLC in stock now, across every platform we carry.`} index={index} indexLabel={`${genre.label} by platform`} />
      <CatalogBrowser
        basePath={basePath}
        params={{ ...query, category: null, genres: [], page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        defaultSort="popular"
        related={others}
        headingId="genre-results"
        heading={t("resultsIn", { name: genre.label })}
        hide={["genres"]}
      />
    </div>
  );
}
