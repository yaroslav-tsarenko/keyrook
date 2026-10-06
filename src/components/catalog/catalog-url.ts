import { GENRES, PLATFORMS, PRODUCT_TYPES, REGIONS } from "@/lib/keys/taxonomy";

export const SORT_KEYS = ["newest", "price-asc", "price-desc", "popular", "name-asc", "relevance", "release-desc", "discount"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const CATALOG_PAGE_SIZE = 24;

export const LIST_FILTERS = ["types", "platforms", "regions", "genres", "languages", "years"] as const;
export type ListFilter = (typeof LIST_FILTERS)[number];

export const LIST_PARAM: Record<ListFilter, string> = {
  types: "type",
  platforms: "platform",
  regions: "region",
  genres: "genre",
  languages: "language",
  years: "year",
};

const TYPE_KEYS = new Set<string>(PRODUCT_TYPES.map((t) => t.key));
const PLATFORM_KEYS = new Set<string>(PLATFORMS.map((p) => p.key));
const REGION_KEYS = new Set<string>(REGIONS.map((r) => r.key));
const GENRE_KEYS = new Set<string>(GENRES.map((g) => g.key));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VALID: Record<ListFilter, (value: string) => boolean> = {
  types: (v) => TYPE_KEYS.has(v),
  platforms: (v) => PLATFORM_KEYS.has(v),
  regions: (v) => REGION_KEYS.has(v),
  genres: (v) => GENRE_KEYS.has(v),
  languages: (v) => SLUG.test(v) && v.length <= 40,
  years: (v) => /^(19[89]\d|20\d\d)$/.test(v),
};

export interface CatalogParams {
  sort: SortKey;
  page: number;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  onSale: boolean;
  brand: string | null;
  category: string | null;
  types: string[];
  platforms: string[];
  regions: string[];
  genres: string[];
  languages: string[];
  years: string[];
}

export interface CategoryOption {
  key: string;
  name: string;
  count: number;
  href: string;
  active: boolean;
  depth: 0 | 1;
}

export interface FacetOption {
  key: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface CatalogFacets {
  categoryTitle: "category" | "subcategory";
  categories: CategoryOption[];
  brands: { name: string; count: number }[];
  price: { min: number; max: number } | null;
  inStockCount: number;
  onSaleCount: number;
  narrowingInStock: boolean;
  types: FacetOption[];
  platforms: FacetOption[];
  regions: FacetOption[];
  genres: FacetOption[];
  languages: FacetOption[];
  years: FacetOption[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function price(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function list(raw: RawSearchParams, filter: ListFilter): string[] {
  const value = raw[LIST_PARAM[filter]];
  const values = (Array.isArray(value) ? value : [value ?? ""]).flatMap((v) => v.split(","));
  const clean = values.map((v) => v.trim().toLowerCase()).filter((v) => v && VALID[filter](v));
  return [...new Set(clean)].sort().slice(0, 30);
}

export function parseCatalogParams(raw: RawSearchParams, defaultSort: SortKey = "newest"): CatalogParams {
  const sortRaw = first(raw.sort) as SortKey;
  const page = parseInt(first(raw.page), 10);
  let minPrice = price(first(raw.minPrice));
  let maxPrice = price(first(raw.maxPrice));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  return {
    sort: SORT_KEYS.includes(sortRaw) ? sortRaw : defaultSort,
    page: Number.isFinite(page) && page > 1 ? page : 1,
    minPrice,
    maxPrice,
    inStock: first(raw.inStock) === "true",
    onSale: first(raw.onSale) === "true",
    brand: first(raw.brand).trim() || null,
    category: first(raw.category).trim() || null,
    types: list(raw, "types"),
    platforms: list(raw, "platforms"),
    regions: list(raw, "regions"),
    genres: list(raw, "genres"),
    languages: list(raw, "languages"),
    years: list(raw, "years"),
  };
}

export function hasActiveFilters(params: CatalogParams): boolean {
  return (
    params.minPrice !== null ||
    params.maxPrice !== null ||
    params.inStock ||
    params.onSale ||
    Boolean(params.brand) ||
    Boolean(params.category) ||
    LIST_FILTERS.some((f) => params[f].length > 0)
  );
}

export type ParamOverrides = Partial<CatalogParams>;

export function buildCatalogHref(
  basePath: string,
  params: CatalogParams,
  overrides: ParamOverrides = {},
  options: { fixed?: Record<string, string>; defaultSort?: SortKey; resetPage?: boolean } = {},
): string {
  const next: CatalogParams = { ...params, ...overrides };
  const resetPage = options.resetPage ?? !("page" in overrides);
  if (resetPage) next.page = 1;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(options.fixed ?? {})) if (value) qs.set(key, value);
  if (next.category) qs.set("category", next.category);
  for (const filter of LIST_FILTERS) {
    const values = [...new Set(next[filter])].sort();
    if (values.length) qs.set(LIST_PARAM[filter], values.join(","));
  }
  if (next.brand) qs.set("brand", next.brand);
  if (next.minPrice !== null) qs.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== null) qs.set("maxPrice", String(next.maxPrice));
  if (next.inStock) qs.set("inStock", "true");
  if (next.onSale) qs.set("onSale", "true");
  if (next.sort !== (options.defaultSort ?? "newest")) qs.set("sort", next.sort);
  if (next.page > 1) qs.set("page", String(next.page));
  const query = qs.toString().replace(/%2C/g, ",");
  return query ? `${basePath}?${query}` : basePath;
}

export function clearedParams(params: CatalogParams): CatalogParams {
  return {
    ...params,
    minPrice: null,
    maxPrice: null,
    inStock: false,
    onSale: false,
    brand: null,
    category: null,
    types: [],
    platforms: [],
    regions: [],
    genres: [],
    languages: [],
    years: [],
    page: 1,
  };
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
