"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { FilterChip, FilterChipRow } from "@/components/ui/Chip";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import { ProductSort, CATALOG_SORTS } from "@/components/product/ProductSort/ProductSort";
import { FilterSummary, ProductFilters, ProductFiltersSheet, useDisplayPrice, type FilterSelection } from "@/components/product/ProductFilters/ProductFilters";
import type { SkinProduct } from "@/components/skin/SkinTray";
import { raritySlug } from "@/lib/skins/cs2";
import { CATALOG_PAGE_SIZE, LIST_FILTERS, buildCatalogHref, clearedParams, hasActiveFilters, type CatalogFacets, type CatalogParams, type ListFilter, type SortKey } from "./catalog-url";

export interface CatalogBrowserProps {
  basePath: string;
  fixed?: Record<string, string>;
  defaultSort?: SortKey;
  sortOptions?: SortKey[];
  params: CatalogParams;
  products: SkinProduct[];
  total: number;
  page: number;
  totalPages: number;
  facets: CatalogFacets;
  contextLabel?: string | null;
  activeCategoryName?: string | null;
  related: { name: string; href: string }[];
  headingId: string;
  heading: string;
}

const QUALITY_CHIP: Record<string, string> = { stattrak: "StatTrak™", souvenir: "Souvenir", normal: "Standard" };

export function CatalogBrowser({
  basePath,
  fixed,
  defaultSort = "newest",
  sortOptions = CATALOG_SORTS,
  params,
  products,
  total,
  page,
  totalPages,
  facets,
  contextLabel,
  activeCategoryName,
  related,
  headingId,
  heading,
}: CatalogBrowserProps) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { format, toDisplay } = useDisplayPrice();
  const hrefOpts = { fixed, defaultSort };

  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  const apply = (next: Partial<CatalogParams>) => go(buildCatalogHref(basePath, params, next, hrefOpts));
  const clearAll = () => go(buildCatalogHref(basePath, clearedParams(params), {}, hrefOpts));

  const money = (base: number) => {
    const v = toDisplay(base);
    return format(v, Number.isInteger(v) ? 0 : 2);
  };
  const priceLabel =
    params.minPrice !== null && params.maxPrice !== null
      ? `${money(params.minPrice)}–${money(params.maxPrice)}`
      : params.minPrice !== null
        ? t("chipPriceFrom", { min: money(params.minPrice) })
        : params.maxPrice !== null
          ? t("chipPriceTo", { max: money(params.maxPrice) })
          : null;

  const chips: { key: string; label: string; onRemove: () => void; rarity?: string }[] = [];
  if (activeCategoryName) chips.push({ key: "category", label: activeCategoryName, onRemove: () => apply({ category: null }) });
  if (priceLabel) chips.push({ key: "price", label: priceLabel, onRemove: () => apply({ minPrice: null, maxPrice: null }) });
  for (const filter of LIST_FILTERS) {
    for (const key of params[filter]) {
      const option = facets[filter].find((o) => o.key === key);
      const label = filter === "qualities" ? `${QUALITY_CHIP[key] ?? key}` : option?.label ?? key;
      chips.push({
        key: `${filter}:${key}`,
        label,
        rarity: filter === "rarities" ? raritySlug(key) : undefined,
        onRemove: () => apply({ [filter]: params[filter].filter((v) => v !== key) }),
      });
    }
  }
  if (params.floatMin !== null || params.floatMax !== null) {
    chips.push({
      key: "float",
      label: t("chipFloatRange", { min: (params.floatMin ?? 0).toFixed(2), max: (params.floatMax ?? 1).toFixed(2) }),
      onRemove: () => apply({ floatMin: null, floatMax: null }),
    });
  }

  const parts = [contextLabel].filter((p): p is string => Boolean(p));
  const selection: FilterSelection = {
    brand: params.brand,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock,
    onSale: params.onSale,
    types: params.types,
    weapons: params.weapons,
    rarities: params.rarities,
    exteriors: params.exteriors,
    qualities: params.qualities,
    phases: params.phases,
    collections: params.collections,
    floatMin: params.floatMin,
    floatMax: params.floatMax,
  };
  const filtering = hasActiveFilters(params);
  const filterCount = chips.length;

  const suggestions = (LIST_FILTERS as readonly ListFilter[])
    .filter((f) => params[f].length > 0)
    .map((f) => {
      const without = facets[f].reduce((sum, o) => sum + o.count, 0);
      const labels = params[f].map((k) => (f === "qualities" ? QUALITY_CHIP[k] ?? k : facets[f].find((o) => o.key === k)?.label ?? k));
      return { filter: f, gain: without - total, label: labels.join(", ") };
    })
    .filter((s) => s.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3);

  const filters = <ProductFilters facets={facets} selection={selection} onChange={(next) => apply(next)} />;

  return (
    <div data-catalog="" className="lg:grid lg:grid-cols-[288px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside
        aria-label="Filters"
        className="hidden lg:sticky lg:top-[calc(var(--header-height-compact)+16px)] lg:block lg:max-h-[calc(100dvh-var(--header-height-compact)-32px)] lg:overflow-y-auto lg:pb-6 lg:pr-1"
      >
        {filters}
      </aside>

      <section aria-labelledby={headingId} className="min-w-0">
        <h2 id={headingId} className="sr-only">
          {heading}
        </h2>
        <div
          data-catalog-toolbar=""
          className="sticky top-[var(--header-height-mobile)] z-30 -mx-gutter flex items-center justify-between gap-3 border-b border-line bg-surface px-gutter py-2 lg:hidden"
        >
          <Button variant="outline" size="sm" onPress={() => setSheetOpen(true)} startContent={<SlidersHorizontal size={16} aria-hidden="true" />}>
            Filter
            {filterCount > 0 ? <span className="font-mono text-[0.75rem] normal-case tracking-normal">{filterCount}</span> : null}
          </Button>
          <ProductSort value={params.sort} options={sortOptions} onChange={(sort) => apply({ sort })} />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-5 pt-4 lg:pt-0">
          <FilterSummary total={total} parts={parts} chips={chips} onClearAll={chips.length > 0 ? clearAll : undefined} />
          <ProductSort value={params.sort} options={sortOptions} onChange={(sort) => apply({ sort })} className="hidden lg:flex" />
        </div>

        <span aria-live="polite" className="sr-only">
          {pending ? t("updating") : ""}
        </span>

        <div aria-busy={pending || undefined} className={cn("transition-opacity duration-[140ms]", pending && "opacity-50")}>
          {total === 0 ? (
            filtering ? (
              <EmptyState title={t("emptyFiltersTitle")} subtitle={suggestions.length ? "Loosen one filter to widen the results." : t("emptyFiltersBody")}>
                {suggestions.length > 0 ? (
                  <ul className="m-0 flex list-none flex-col items-center gap-2 p-0">
                    {suggestions.map((s) => (
                      <li key={s.filter}>
                        <button
                          type="button"
                          onClick={() => apply({ [s.filter]: [] } as Partial<CatalogParams>)}
                          className="min-h-10 cursor-pointer text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
                        >
                          Remove {s.label} to see <span className="font-mono text-data">{s.gain.toLocaleString("en-GB")}</span> more
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {chips.length > 0 ? (
                  <FilterChipRow onClearAll={clearAll} className="mt-2 justify-center">
                    {chips.map((chip) => (
                      <FilterChip key={chip.key} label={chip.label} rarity={chip.rarity} onRemove={chip.onRemove} />
                    ))}
                  </FilterChipRow>
                ) : null}
              </EmptyState>
            ) : (
              <EmptyState title={t("emptyCategoryTitle")} subtitle={t("emptyCategoryBody")}>
                {related.length > 0 ? (
                  <ul className="m-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0">
                    {related.map((r) => (
                      <li key={r.href}>
                        <Link href={r.href} className="text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                          {r.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </EmptyState>
            )
          ) : (
            <>
              <ProductGrid products={products} priorityCount={2} />
              <Pagination page={page} totalPages={totalPages} hrefForPage={(p) => buildCatalogHref(basePath, params, { page: p }, hrefOpts)} className="mt-14 pb-4" />
              {totalPages > 1 ? (
                <p className="m-0 mt-2 text-center font-mono text-data text-ink-muted">
                  {t("showingRange", { from: ((page - 1) * CATALOG_PAGE_SIZE + 1).toLocaleString("en-GB"), to: Math.min(page * CATALOG_PAGE_SIZE, total).toLocaleString("en-GB"), total: total.toLocaleString("en-GB") })}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <ProductFiltersSheet open={sheetOpen} onClose={() => setSheetOpen(false)} total={total} onClearAll={clearAll}>
        {filters}
      </ProductFiltersSheet>
    </div>
  );
}
