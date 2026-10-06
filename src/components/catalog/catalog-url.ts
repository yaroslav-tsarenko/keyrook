import { EXTERIORS, RARITIES, WEAPON_TYPES } from "@/lib/skins/cs2";

export const SORT_KEYS = ["newest", "price-asc", "price-desc", "popular", "name-asc", "relevance", "rarity-desc", "float-asc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const CATALOG_PAGE_SIZE = 24;

export const QUALITY_KEYS = ["normal", "stattrak", "souvenir"] as const;
export type QualityKey = (typeof QUALITY_KEYS)[number];

export const LIST_FILTERS = ["types", "weapons", "rarities", "exteriors", "qualities", "phases", "collections"] as const;
export type ListFilter = (typeof LIST_FILTERS)[number];

const LIST_PARAM: Record<ListFilter, string> = {
  types: "type",
  weapons: "weapon",
  rarities: "rarity",
  exteriors: "exterior",
  qualities: "quality",
  phases: "phase",
  collections: "collection",
};

const TYPE_KEYS = new Set<string>(WEAPON_TYPES.map((t) => t.key));
const RARITY_KEYS = new Set<string>(RARITIES.map((r) => r.key));
export const NOT_PAINTED = "np";
const EXTERIOR_KEYS = new Set<string>([...EXTERIORS.map((e) => e.code.toLowerCase()), NOT_PAINTED]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VALID: Record<ListFilter, (value: string) => boolean> = {
  types: (v) => TYPE_KEYS.has(v),
  weapons: (v) => SLUG.test(v) && v.length <= 40,
  rarities: (v) => RARITY_KEYS.has(v),
  exteriors: (v) => EXTERIOR_KEYS.has(v),
  qualities: (v) => (QUALITY_KEYS as readonly string[]).includes(v),
  phases: (v) => SLUG.test(v) && v.length <= 40,
  collections: (v) => SLUG.test(v) && v.length <= 80,
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
  weapons: string[];
  rarities: string[];
  exteriors: string[];
  qualities: string[];
  phases: string[];
  collections: string[];
  floatMin: number | null;
  floatMax: number | null;
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
  color?: string | null;
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
  weapons: FacetOption[];
  rarities: FacetOption[];
  exteriors: FacetOption[];
  qualities: FacetOption[];
  phases: FacetOption[];
  collections: FacetOption[];
  float: { min: number; max: number } | null;
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

function wear(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? Math.round(n * 10000) / 10000 : null;
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
  let floatMin = wear(first(raw.floatMin));
  let floatMax = wear(first(raw.floatMax));
  if (floatMin !== null && floatMax !== null && floatMin > floatMax) [floatMin, floatMax] = [floatMax, floatMin];
  if (floatMin === 0) floatMin = null;
  if (floatMax === 1) floatMax = null;
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
    weapons: list(raw, "weapons"),
    rarities: list(raw, "rarities"),
    exteriors: list(raw, "exteriors"),
    qualities: list(raw, "qualities"),
    phases: list(raw, "phases"),
    collections: list(raw, "collections"),
    floatMin,
    floatMax,
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
    LIST_FILTERS.some((f) => params[f].length > 0) ||
    params.floatMin !== null ||
    params.floatMax !== null
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
  if (next.floatMin !== null) qs.set("floatMin", String(next.floatMin));
  if (next.floatMax !== null) qs.set("floatMax", String(next.floatMax));
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
    weapons: [],
    rarities: [],
    exteriors: [],
    qualities: [],
    phases: [],
    collections: [],
    floatMin: null,
    floatMax: null,
    page: 1,
  };
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
