import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mentionsSupplier, publicBrand } from "@/lib/utils/supplier";
import { isNewArrival, newArrivalCutoff } from "@/lib/new-arrivals";
import type { CatalogProduct } from "@/components/product/product-face";
import { slugify } from "@/lib/utils/slugify";
import { GENRES, PLATFORMS, PRODUCT_TYPES, REGIONS, genreDef, platformDef, productTypeDef, regionDef, type KeySummary, type PlatformDef } from "@/lib/keys/taxonomy";
import {
  CATALOG_PAGE_SIZE,
  LIST_FILTERS,
  buildCatalogHref,
  type CatalogFacets,
  type CatalogParams,
  type CategoryOption,
  type FacetOption,
  type ListFilter,
  type SortKey,
} from "./catalog-url";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
}

export interface CategoryTree {
  all: CategoryRecord[];
  roots: CategoryRecord[];
  bySlug: Map<string, CategoryRecord>;
  byId: Map<string, CategoryRecord>;
  children: (id: string) => CategoryRecord[];
  subtreeIds: (id: string) => string[];
  uniqueArt: (category: CategoryRecord) => string | null;
}

export const getCategoryTree = cache(async (): Promise<CategoryTree> => {
  const all = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true, parentId: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const byId = new Map(all.map((c) => [c.id, c]));
  const childMap = new Map<string, CategoryRecord[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    const list = childMap.get(c.parentId) ?? [];
    list.push(c);
    childMap.set(c.parentId, list);
  }
  const children = (id: string) => childMap.get(id) ?? [];
  const subtreeIds = (id: string): string[] => [id, ...children(id).flatMap((c) => subtreeIds(c.id))];
  const artOwner = new Map<string, string>();
  const depth = (c: CategoryRecord): number => (c.parentId && byId.has(c.parentId) ? 1 + depth(byId.get(c.parentId)!) : 0);
  for (const c of [...all].sort((a, b) => depth(a) - depth(b) || a.sortOrder - b.sortOrder)) {
    if (c.imageUrl && !artOwner.has(c.imageUrl)) artOwner.set(c.imageUrl, c.id);
  }
  const uniqueArt = (c: CategoryRecord) => (c.imageUrl && artOwner.get(c.imageUrl) === c.id ? c.imageUrl : null);
  return { all, roots: all.filter((c) => !c.parentId), bySlug, byId, children, subtreeIds, uniqueArt };
});

interface Row {
  id: string;
  name: string;
  price: number;
  compare: number | null;
  quantity: number;
  tracked: boolean;
  brand: string | null;
  createdAt: number;
  orders: number;
  cats: Set<string>;
  score: number;
  type: string | null;
  platform: string | null;
  region: string | null;
  genres: string[];
  languages: string[];
  languageLabels: Map<string, string>;
  year: string | null;
  release: number;
}

type Facet = "category" | "brand" | "price" | "inStock" | "onSale" | ListFilter;

export const KEY_SELECT = {
  title: true,
  productType: true,
  platform: true,
  region: true,
  edition: true,
  languages: true,
  genres: true,
  releaseYear: true,
  validity: true,
} as const;

export function keySummary(item: KeySummary | null | undefined): KeySummary | null {
  if (!item) return null;
  return {
    title: item.title,
    productType: item.productType,
    platform: item.platform,
    region: item.region,
    edition: item.edition,
    languages: item.languages,
    genres: item.genres,
    releaseYear: item.releaseYear,
    validity: item.validity,
  };
}

export type CatalogScope =
  | { kind: "all" }
  | { kind: "category"; category: CategoryRecord }
  | { kind: "platform"; platform: PlatformDef }
  | { kind: "search"; query: string };

export interface CatalogResult {
  products: CatalogProduct[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  scopeTotal: number;
  facets: CatalogFacets;
  activeCategoryName: string | null;
}

function searchWhere(query: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { item: { title: { contains: query, mode: "insensitive" } } },
      { item: { developers: { has: query } } },
      { item: { publishers: { has: query } } },
    ],
  };
}

function scoreFor(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n.startsWith(q)) return 3;
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(n)) return 2;
  if (n.includes(q)) return 1;
  return 0;
}

async function loadRows(scope: CatalogScope, tree: CategoryTree): Promise<Row[]> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (scope.kind === "category") where.categories = { some: { categoryId: { in: tree.subtreeIds(scope.category.id) } } };
  if (scope.kind === "platform") where.item = { platform: scope.platform.key };
  if (scope.kind === "search") {
    if (scope.query.length < 2 || mentionsSupplier(scope.query)) return [];
    Object.assign(where, searchWhere(scope.query));
  }
  const rows = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      price: true,
      comparePrice: true,
      quantity: true,
      trackInventory: true,
      brand: true,
      createdAt: true,
      categories: { select: { categoryId: true } },
      _count: { select: { orderItems: true } },
      item: { select: { title: true, productType: true, platform: true, region: true, genres: true, languages: true, releaseYear: true, releaseDate: true } },
    },
  });
  return rows.map((r) => {
    const languageLabels = new Map((r.item?.languages ?? []).map((l) => [slugify(l), l]));
    return {
      id: r.id,
      name: r.item?.title ?? r.name,
      price: Number(r.price),
      compare: r.comparePrice != null ? Number(r.comparePrice) : null,
      quantity: r.quantity,
      tracked: r.trackInventory,
      brand: publicBrand(r.brand),
      createdAt: r.createdAt.getTime(),
      orders: r._count.orderItems,
      cats: new Set(r.categories.map((c) => c.categoryId)),
      score: scope.kind === "search" ? scoreFor(r.item?.title ?? r.name, scope.query) : 0,
      type: r.item?.productType ?? null,
      platform: r.item?.platform ?? null,
      region: r.item?.region ?? null,
      genres: r.item?.genres ?? [],
      languages: [...languageLabels.keys()],
      languageLabels,
      year: r.item?.releaseYear ? String(r.item.releaseYear) : null,
      release: r.item?.releaseDate ? r.item.releaseDate.getTime() : 0,
    };
  });
}

const LIST_VALUES: Record<ListFilter, (row: Row) => string[]> = {
  types: (r) => (r.type ? [r.type] : []),
  platforms: (r) => (r.platform ? [r.platform] : []),
  regions: (r) => (r.region ? [r.region] : []),
  genres: (r) => r.genres,
  languages: (r) => r.languages,
  years: (r) => (r.year ? [r.year] : []),
};

const available = (r: Row) => !r.tracked || r.quantity > 0;
const reduced = (r: Row) => r.compare !== null && r.compare > r.price;

function matcher(params: CatalogParams, categoryIds: Set<string> | null) {
  return (row: Row, except: Facet | null = null) => {
    if (except !== "category" && categoryIds && ![...row.cats].some((id) => categoryIds.has(id))) return false;
    if (except !== "brand" && params.brand && row.brand !== params.brand) return false;
    if (except !== "price") {
      if (params.minPrice !== null && row.price < params.minPrice) return false;
      if (params.maxPrice !== null && row.price > params.maxPrice) return false;
    }
    if (except !== "inStock" && params.inStock && !available(row)) return false;
    if (except !== "onSale" && params.onSale && !reduced(row)) return false;
    for (const filter of LIST_FILTERS) {
      if (except === filter || params[filter].length === 0) continue;
      const values = LIST_VALUES[filter](row);
      if (!values.some((v) => params[filter].includes(v))) return false;
    }
    return true;
  };
}

function sorter(sort: SortKey) {
  const byNewest = (a: Row, b: Row) => b.createdAt - a.createdAt || a.name.localeCompare(b.name);
  switch (sort) {
    case "price-asc":
      return (a: Row, b: Row) => a.price - b.price || byNewest(a, b);
    case "price-desc":
      return (a: Row, b: Row) => b.price - a.price || byNewest(a, b);
    case "name-asc":
      return (a: Row, b: Row) => a.name.localeCompare(b.name, "en-GB");
    case "popular":
      return (a: Row, b: Row) => b.orders - a.orders || b.release - a.release || byNewest(a, b);
    case "release-desc":
      return (a: Row, b: Row) => b.release - a.release || a.name.localeCompare(b.name, "en-GB");
    case "relevance":
      return (a: Row, b: Row) => b.score - a.score || Number(available(b)) - Number(available(a)) || b.release - a.release || a.name.localeCompare(b.name, "en-GB");
    default:
      return byNewest;
  }
}

function leafCategory(categories: { category: { name: string; slug: string; parentId: string | null } }[]) {
  const leaf = categories.find((c) => c.category.parentId) ?? categories[0];
  return leaf?.category ?? null;
}

export async function loadKeyProducts(ids: string[]): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];
  const [records, newSince] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        comparePrice: true,
        quantity: true,
        trackInventory: true,
        createdAt: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
        categories: { select: { category: { select: { name: true, slug: true, parentId: true } } } },
        item: { select: KEY_SELECT },
      },
    }),
    newArrivalCutoff(),
  ]);
  const byId = new Map(records.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => {
      const leaf = leafCategory(r.categories);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        sku: r.sku,
        price: Number(r.price),
        comparePrice: r.comparePrice != null ? Number(r.comparePrice) : null,
        quantity: r.trackInventory ? r.quantity : undefined,
        images: r.images.map((img) => ({ url: img.url, alt: img.alt })),
        category: leaf?.name ?? null,
        createdAt: r.createdAt.toISOString(),
        isNew: isNewArrival(r.createdAt, newSince),
        key: keySummary(r.item),
      };
    });
}

export async function queryCatalog(
  scope: CatalogScope,
  params: CatalogParams,
  options: { basePath: string; fixed?: Record<string, string>; defaultSort?: SortKey },
): Promise<CatalogResult> {
  const tree = await getCategoryTree();
  const rows = await loadRows(scope, tree);
  const hrefOpts = { fixed: options.fixed, defaultSort: options.defaultSort };

  const paramCategory = scope.kind !== "category" && params.category ? tree.bySlug.get(params.category) ?? null : null;
  const categoryIds = paramCategory ? new Set(tree.subtreeIds(paramCategory.id)) : null;
  const passes = matcher(params, categoryIds);

  const inSubtree = (row: Row, id: string) => tree.subtreeIds(id).some((cid) => row.cats.has(cid));
  const countIn = (id: string) => rows.filter((r) => passes(r, "category") && inSubtree(r, id)).length;

  let categoryTitle: CatalogFacets["categoryTitle"] = "category";
  let categories: CategoryOption[] = [];
  if (scope.kind === "category") {
    const current = scope.category;
    const parent = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
    const anchor = parent ?? current;
    const siblings = tree.children(anchor.id);
    if (siblings.length > 0) {
      categoryTitle = "subcategory";
      const siblingRows = parent ? await loadRows({ kind: "category", category: anchor }, tree) : rows;
      const anchorCount = siblingRows.filter((r) => passes(r, "category")).length;
      const siblingCount = (id: string) => siblingRows.filter((r) => passes(r, "category") && inSubtree(r, id)).length;
      categories = [
        { key: anchor.slug, name: `All ${anchor.name.toLowerCase()}`, count: anchorCount, href: buildCatalogHref(`/catalog/${anchor.slug}`, params, {}, hrefOpts), active: !parent, depth: 0 as const },
        ...siblings.map((c) => ({ key: c.slug, name: c.name, count: siblingCount(c.id), href: buildCatalogHref(`/catalog/${c.slug}`, params, {}, hrefOpts), active: c.id === current.id, depth: 1 as const })),
      ].filter((o) => o.count > 0 || o.active);
    }
  } else if (scope.kind === "search") {
    categories = tree.roots
      .map((c) => ({ key: c.slug, name: c.name, count: countIn(c.id), href: buildCatalogHref(options.basePath, params, { category: c.slug }, hrefOpts), active: paramCategory?.id === c.id, depth: 0 as const }))
      .filter((o) => o.count > 0 || o.active);
  }

  const brandCounts = new Map<string, number>();
  for (const r of rows) if (r.brand && passes(r, "brand")) brandCounts.set(r.brand, (brandCounts.get(r.brand) ?? 0) + 1);
  const brands = [...brandCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
  if (params.brand && !brandCounts.has(params.brand)) brands.push({ name: params.brand, count: 0 });

  const priceRows = rows.filter((r) => passes(r, "price"));
  const price = priceRows.length ? { min: Math.min(...priceRows.map((r) => r.price)), max: Math.max(...priceRows.map((r) => r.price)) } : null;

  const stockBase = rows.filter((r) => passes(r, "inStock"));
  const inStockCount = stockBase.filter(available).length;
  const onSaleCount = rows.filter((r) => passes(r, "onSale") && reduced(r)).length;

  const listFacet = (filter: ListFilter, label: (key: string, sample: Row) => string, order: (key: string) => number): FacetOption[] => {
    const counts = new Map<string, { count: number; sample: Row }>();
    for (const r of rows) {
      if (!passes(r, filter)) continue;
      for (const value of LIST_VALUES[filter](r)) {
        const entry = counts.get(value);
        if (entry) entry.count += 1;
        else counts.set(value, { count: 1, sample: r });
      }
    }
    const options: FacetOption[] = [...counts.entries()].map(([key, { count, sample }]) => ({ key, label: label(key, sample), count, selected: params[filter].includes(key) }));
    for (const key of params[filter]) if (!counts.has(key)) options.push({ key, label: key, count: 0, selected: true });
    return options.sort((a, b) => order(a.key) - order(b.key) || a.label.localeCompare(b.label, "en-GB"));
  };

  const types = listFacet("types", (key) => productTypeDef(key)?.label ?? key, (key) => PRODUCT_TYPES.findIndex((t) => t.key === key));
  const platforms = listFacet("platforms", (key) => platformDef(key)?.label ?? key, (key) => PLATFORMS.findIndex((p) => p.key === key));
  const regions = listFacet("regions", (key) => regionDef(key)?.label ?? key, (key) => REGIONS.findIndex((r) => r.key === key));
  const genres = listFacet("genres", (key) => genreDef(key)?.label ?? key, (key) => GENRES.findIndex((g) => g.key === key));
  const languages = listFacet("languages", (key, sample) => sample.languageLabels.get(key) ?? key, (key) => (key === "english" ? -1 : 0));
  const years = listFacet("years", (key) => key, (key) => -Number(key));

  const matched = rows.filter((r) => passes(r)).sort(sorter(params.sort));
  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const pageIds = matched.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE).map((r) => r.id);
  const products = await loadKeyProducts(pageIds);

  return {
    products,
    total,
    page,
    totalPages,
    pageSize: CATALOG_PAGE_SIZE,
    scopeTotal: rows.length,
    activeCategoryName: paramCategory?.name ?? null,
    facets: { categoryTitle, categories, brands, price, inStockCount, onSaleCount, narrowingInStock: inStockCount > 0 && inStockCount < stockBase.length, types, platforms, regions, genres, languages, years },
  };
}

export interface CategoryStats {
  count: number;
  inStock: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export async function categoryStats(categoryIds: string[]): Promise<CategoryStats> {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", categories: { some: { categoryId: { in: categoryIds } } } },
    select: { price: true, quantity: true, trackInventory: true },
  });
  const prices = rows.map((r) => Number(r.price));
  return {
    count: rows.length,
    inStock: rows.filter((r) => !r.trackInventory || r.quantity > 0).length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
}

export async function categoryCounts(tree: CategoryTree): Promise<Map<string, number>> {
  const links = await prisma.productCategory.findMany({
    where: { product: { status: "ACTIVE" }, category: { isActive: true } },
    select: { productId: true, categoryId: true },
  });
  const byCategory = new Map<string, Set<string>>();
  for (const link of links) {
    const set = byCategory.get(link.categoryId) ?? new Set<string>();
    set.add(link.productId);
    byCategory.set(link.categoryId, set);
  }
  const counts = new Map<string, number>();
  for (const c of tree.all) {
    const ids = new Set<string>();
    for (const id of tree.subtreeIds(c.id)) for (const pid of byCategory.get(id) ?? []) ids.add(pid);
    counts.set(c.id, ids.size);
  }
  return counts;
}
