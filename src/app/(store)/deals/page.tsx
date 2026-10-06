import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { STORE_POLICY } from "@/config/store-policy";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface DealsPageProps {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: DealsPageProps): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams, "discount");
  const title = query.page > 1 ? t("titleWithPage", { title: "Price cuts", page: query.page }) : "Price cuts";
  const description = pagedDescription(`Game keys priced below their recent price. The earlier price shown is the lowest price in the ${STORE_POLICY.deals.compareWindowDays} days before the cut.`, query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters({ ...query, onSale: false });
  return pageMetadata({ title, description, path: query.page > 1 ? `/deals?page=${query.page}` : "/deals", canonical: !filtered, images: false, index: !filtered });
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const t = await getTranslations("catalog");
  const query = { ...parseCatalogParams(await searchParams, "discount"), onSale: true };
  const result = await queryCatalog({ kind: "all" }, { ...query, category: null }, { basePath: "/deals", defaultSort: "discount" });
  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: "Catalogue", href: "/catalog" }, { label: "Price cuts" }]} />
      <CategoryOpener
        name="Price cuts"
        count={result.facets.onSaleCount}
        note={<p className="m-0 max-w-[68ch] border-y border-line py-3 text-ui-md text-ink">The earlier price is the lowest price this key had in the {STORE_POLICY.deals.compareWindowDays} days before the cut.</p>}
      />
      <CatalogBrowser
        basePath="/deals"
        params={{ ...query, category: null, page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        defaultSort="discount"
        related={[{ name: "All keys", href: "/catalog" }]}
        headingId="deals-results"
        heading="Price cuts"
        lockOnSale
      />
    </div>
  );
}
