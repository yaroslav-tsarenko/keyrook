import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { ReleaseRuler, type ReleaseWeek } from "@/components/catalog/ReleaseRuler";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface ReleasesPageProps {
  searchParams: Promise<RawSearchParams>;
}

const WEEKS = 8;
const DAY = 86_400_000;

async function releaseWeeks(): Promise<ReleaseWeek[]> {
  const now = Date.now();
  const start = now - WEEKS * 7 * DAY;
  const rows = await prisma.keyItem.findMany({
    where: { releaseDate: { gte: new Date(start), lte: new Date(now) }, product: { status: "ACTIVE", quantity: { gt: 0 } } },
    select: { releaseDate: true },
  });
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ start: new Date(start + i * 7 * DAY).toISOString(), count: 0 }));
  for (const r of rows) {
    if (!r.releaseDate) continue;
    const i = Math.min(WEEKS - 1, Math.floor((r.releaseDate.getTime() - start) / (7 * DAY)));
    if (i >= 0) weeks[i].count += 1;
  }
  return weeks;
}

export async function generateMetadata({ searchParams }: ReleasesPageProps): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "release-desc");
  const title = query.page > 1 ? t("titleWithPage", { title: "New releases", page: query.page }) : "New releases";
  const description = pagedDescription("Recently released games and DLC in stock now, newest first, with platform, region and languages on every key.", query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(query);
  return pageMetadata({ title, description, path: query.page > 1 ? `/new-releases?page=${query.page}` : "/new-releases", canonical: !filtered, index: !filtered });
}

export default async function NewReleasesPage({ searchParams }: ReleasesPageProps) {
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "release-desc");
  const [weeks, result] = await Promise.all([releaseWeeks(), queryCatalog({ kind: "released" }, { ...query, category: null }, { basePath: "/new-releases", defaultSort: "release-desc" })]);
  const recent = weeks.reduce((a, w) => a + w.count, 0);
  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: "Catalogue", href: "/catalog" }, { label: "New releases" }]} />
      <CategoryOpener name="New releases" count={recent} lead="Released in the last eight weeks and in stock now. Keys for titles that aren't out yet are not listed." />
      {recent > 0 ? <ReleaseRuler weeks={weeks} className="mb-12 max-w-[960px]" /> : null}
      <CatalogBrowser
        basePath="/new-releases"
        params={{ ...query, category: null, page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        defaultSort="release-desc"
        related={[{ name: "All keys", href: "/catalog" }]}
        headingId="releases-results"
        heading="New releases"
      />
    </div>
  );
}
