import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { memoize, memoizeByKey } from "@/lib/utils/memo";
import { mentionsSupplier } from "@/lib/utils/supplier";
import { isNewArrival, newArrivalCutoff } from "@/lib/new-arrivals";
import type { CatalogProduct } from "@/components/product/product-face";
import { slugify } from "@/lib/utils/slugify";
import { GENRES, PLATFORMS, PRODUCT_TYPES, REGIONS, categorySlugFor, genreDef, platformDef, productTypeDef, regionDef, type KeySummary, type PlatformDef } from "@/lib/keys/taxonomy";
import {
  CATALOG_PAGE_SIZE,
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
  faceValue: true,
  faceCurrency: true,
} as const;

type KeySource = Omit<KeySummary, "faceValue"> & { faceValue?: number | { toString(): string } | null };

export function keySummary(item: KeySource | null | undefined): KeySummary | null {
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
    faceValue: item.faceValue != null ? Number(item.faceValue) : null,
    faceCurrency: item.faceCurrency ?? null,
  };
}

export type CatalogScope =
  | { kind: "all" }
  | { kind: "category"; category: CategoryRecord }
  | { kind: "platform"; platform: PlatformDef }
  | { kind: "genre"; genre: { key: string; label: string } }
  | { kind: "released" }
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

const ACTIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus"`;
const AVAILABLE = Prisma.sql`(NOT p."trackInventory" OR p."quantity" > 0)`;
const REDUCED = Prisma.sql`(p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price")`;
const SORT_NAME = Prisma.sql`lower(p."name")`;

function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function searchCondition(query: string): Prisma.Sql {
  const pattern = likePattern(query);
  return Prisma.sql`p."id" IN (
    SELECT "id" FROM "Product" WHERE "name" ILIKE ${pattern} OR "sku" ILIKE ${pattern}
    UNION SELECT "productId" FROM "KeyItem" WHERE "title" ILIKE ${pattern} OR "developers" @> ARRAY[${query}]::text[] OR "publishers" @> ARRAY[${query}]::text[]
  )`;
}

function relevance(query: string): Prisma.Sql {
  const q = query.toLowerCase();
  const word = `\\m${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
  return Prisma.sql`CASE WHEN ${SORT_NAME} LIKE ${`${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`} THEN 3 WHEN ${SORT_NAME} ~ ${word} THEN 2 WHEN ${SORT_NAME} LIKE ${likePattern(q)} THEN 1 ELSE 0 END`;
}

const languageVocabulary = memoize(10 * 60_000, async () => {
  const rows = await prisma.$queryRaw<{ language: string }[]>`SELECT DISTINCT l AS language FROM "KeyItem" k, unnest(k."languages") l`;
  const bySlug = new Map<string, string[]>();
  for (const { language } of rows) bySlug.set(slugify(language), [...(bySlug.get(slugify(language)) ?? []), language]);
  return bySlug;
});

const SYNC_CATEGORIES = new Map<string, { type: string; platform: string | null }>(
  PRODUCT_TYPES.flatMap((type) => [
    [`cat_${type.slug}`, { type: type.key, platform: null }] as const,
    ...PLATFORMS.map((platform) => [`cat_${categorySlugFor(type.key, platform.key)}`, { type: type.key, platform: platform.key }] as const),
  ]),
);

function categoryCondition(ids: string[]): Prisma.Sql {
  const mapped = ids.map((id) => SYNC_CATEGORIES.get(id));
  if (ids.length === 0 || mapped.some((m) => !m)) {
    return Prisma.sql`EXISTS (SELECT 1 FROM "ProductCategory" pc WHERE pc."productId" = p."id" AND pc."categoryId" = ANY(${ids}))`;
  }
  const types = [...new Set(mapped.filter((m) => !m!.platform).map((m) => m!.type))];
  const pairs = mapped.filter((m) => m!.platform && !types.includes(m!.type)).map((m) => `${m!.type}/${m!.platform}`);
  const parts: Prisma.Sql[] = [];
  if (types.length) parts.push(Prisma.sql`k."productType" = ANY(${types})`);
  if (pairs.length) parts.push(Prisma.sql`(k."productType" || '/' || k."platform") = ANY(${pairs})`);
  return parts.length === 1 ? parts[0] : Prisma.sql`(${Prisma.join(parts, " OR ")})`;
}

function scopeCondition(scope: CatalogScope, tree: CategoryTree): Prisma.Sql | null {
  switch (scope.kind) {
    case "category":
      return categoryCondition(tree.subtreeIds(scope.category.id));
    case "platform":
      return Prisma.sql`k."platform" = ${scope.platform.key}`;
    case "genre":
      return Prisma.sql`k."genres" @> ARRAY[${scope.genre.key}]::text[]`;
    case "released":
      return Prisma.sql`k."releaseDate" <= now()`;
    case "search":
      return searchCondition(scope.query);
    default:
      return null;
  }
}

async function filterConditions(params: CatalogParams, categoryIds: string[] | null): Promise<Partial<Record<Facet, Prisma.Sql>>> {
  const out: Partial<Record<Facet, Prisma.Sql>> = {};
  if (categoryIds) out.category = categoryCondition(categoryIds);
  if (params.brand) out.brand = Prisma.sql`p."brand" = ${params.brand}`;
  if (params.minPrice !== null || params.maxPrice !== null) {
    const parts: Prisma.Sql[] = [];
    if (params.minPrice !== null) parts.push(Prisma.sql`p."price" >= ${params.minPrice}`);
    if (params.maxPrice !== null) parts.push(Prisma.sql`p."price" <= ${params.maxPrice}`);
    out.price = Prisma.join(parts, " AND ");
  }
  if (params.inStock) out.inStock = AVAILABLE;
  if (params.onSale) out.onSale = REDUCED;
  if (params.types.length) out.types = Prisma.sql`k."productType" = ANY(${params.types})`;
  if (params.platforms.length) out.platforms = Prisma.sql`k."platform" = ANY(${params.platforms})`;
  if (params.regions.length) out.regions = Prisma.sql`k."region" = ANY(${params.regions})`;
  if (params.genres.length) out.genres = Prisma.sql`k."genres" && ${params.genres}::text[]`;
  if (params.languages.length) {
    const vocabulary = await languageVocabulary();
    const raw = params.languages.flatMap((slug) => vocabulary.get(slug) ?? []);
    out.languages = raw.length ? Prisma.sql`k."languages" && ${raw}::text[]` : Prisma.sql`false`;
  }
  if (params.years.length) out.years = Prisma.sql`k."releaseYear" = ANY(${params.years.map(Number)}::int[])`;
  return out;
}

function sortSql(sort: SortKey, query: string | null): Prisma.Sql {
  switch (sort) {
    case "price-asc":
      return Prisma.sql`p."price" ASC, p."createdAt" DESC, ${SORT_NAME} ASC, p."id" ASC`;
    case "price-desc":
      return Prisma.sql`p."price" DESC, p."createdAt" DESC, ${SORT_NAME} ASC, p."id" ASC`;
    case "name-asc":
      return Prisma.sql`${SORT_NAME} ASC, p."id" ASC`;
    case "popular":
      return Prisma.sql`COALESCE(oc."n", 0) DESC, k."releaseDate" DESC NULLS LAST, p."createdAt" DESC, ${SORT_NAME} ASC, p."id" ASC`;
    case "discount":
      return Prisma.sql`CASE WHEN ${REDUCED} THEN (p."comparePrice" - p."price") / p."comparePrice" ELSE 0 END DESC, p."price" ASC, p."id" ASC`;
    case "release-desc":
      return Prisma.sql`k."releaseDate" DESC NULLS LAST, ${SORT_NAME} ASC, p."id" ASC`;
    case "relevance":
      return query
        ? Prisma.sql`${relevance(query)} DESC, ${AVAILABLE} DESC, k."releaseDate" DESC NULLS LAST, ${SORT_NAME} ASC, p."id" ASC`
        : Prisma.sql`${AVAILABLE} DESC, k."releaseDate" DESC NULLS LAST, ${SORT_NAME} ASC, p."id" ASC`;
    default:
      return Prisma.sql`p."createdAt" DESC, ${SORT_NAME} ASC, p."id" ASC`;
  }
}

function all(conditions: (Prisma.Sql | null | undefined)[]): Prisma.Sql {
  const present = conditions.filter((c): c is Prisma.Sql => Boolean(c));
  return present.length ? Prisma.join(present, " AND ") : Prisma.sql`true`;
}

const cachedFacets = memoizeByKey<unknown[]>(2 * 60_000, { staleMs: 10 * 60_000, max: 400 });

function facetQuery<T>(sql: Prisma.Sql): Promise<T[]> {
  return cachedFacets(`${sql.sql}\u0000${JSON.stringify(sql.values)}`, () => prisma.$queryRaw<T[]>(sql)) as Promise<T[]>;
}

interface FacetRow {
  facet: string;
  key: string | null;
  n: number;
  lo: number | null;
  hi: number | null;
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
        images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
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
        images: r.images.slice(0, 1).map((img) => ({ url: img.url, alt: img.alt })),
        screenshotUrl: r.images[1]?.url ?? null,
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
  const hrefOpts = { fixed: options.fixed, defaultSort: options.defaultSort };
  const query = scope.kind === "search" ? scope.query : null;
  const empty: CatalogResult = {
    products: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pageSize: CATALOG_PAGE_SIZE,
    scopeTotal: 0,
    activeCategoryName: null,
    facets: { categoryTitle: "category", categories: [], brands: [], price: null, inStockCount: 0, onSaleCount: 0, narrowingInStock: false, types: [], platforms: [], regions: [], genres: [], languages: [], years: [] },
  };
  if (query !== null && (query.length < 2 || mentionsSupplier(query))) return empty;

  let categoryTitle: CatalogFacets["categoryTitle"] = "category";
  let baseScope: CatalogScope = scope;
  let categoryIds: string[] | null = null;
  let categoryOptions: { category: CategoryRecord; name: string; href: string; active: boolean; depth: 0 | 1; anchor: boolean }[] = [];
  const paramCategory = scope.kind !== "category" && params.category ? tree.bySlug.get(params.category) ?? null : null;
  if (paramCategory) categoryIds = tree.subtreeIds(paramCategory.id);

  if (scope.kind === "category") {
    const current = scope.category;
    const parent = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
    const anchor = parent ?? current;
    const siblings = tree.children(anchor.id);
    if (siblings.length > 0) {
      categoryTitle = "subcategory";
      if (parent) {
        baseScope = { kind: "category", category: anchor };
        categoryIds = tree.subtreeIds(current.id);
      }
      categoryOptions = [
        { category: anchor, name: `All ${anchor.name.toLowerCase()}`, href: buildCatalogHref(`/catalog/${anchor.slug}`, params, {}, hrefOpts), active: !parent, depth: 0 as const, anchor: true },
        ...siblings.map((c) => ({ category: c, name: c.name, href: buildCatalogHref(`/catalog/${c.slug}`, params, {}, hrefOpts), active: c.id === current.id, depth: 1 as const, anchor: false })),
      ];
    }
  } else if (scope.kind === "search") {
    categoryOptions = tree.roots.map((c) => ({ category: c, name: c.name, href: buildCatalogHref(options.basePath, params, { category: c.slug }, hrefOpts), active: paramCategory?.id === c.id, depth: 0 as const, anchor: false }));
  }

  const scopeSql = scopeCondition(baseScope, tree);
  const filters = await filterConditions(params, categoryIds);
  const keys = Object.keys(filters) as Facet[];
  const flagName = (f: Facet) => Prisma.raw(`"f_${f}"`);
  const flags = keys.length ? Prisma.sql`, ${Prisma.join(keys.map((f) => Prisma.sql`(${filters[f]}) AS ${flagName(f)}`))}` : Prisma.empty;
  const except = (f: Facet | null) => all(keys.filter((k) => k !== f).map((k) => Prisma.sql`b.${flagName(k)}`));
  const columns: Prisma.Sql[] = [];
  const aliases = new Map<string, Prisma.Sql>();
  const column = (signature: string, expression: () => Prisma.Sql) => {
    let alias = aliases.get(signature);
    if (!alias) {
      alias = Prisma.raw(`"a${aliases.size}"`);
      aliases.set(signature, alias);
      columns.push(Prisma.sql`${expression()} AS ${alias}`);
    }
    return alias;
  };
  const signature = (f: Facet | null) => keys.filter((k) => k !== f).join(",");
  const counted = (f: Facet | null, extra?: { tag: string; sql: Prisma.Sql }) =>
    column(`count:${signature(f)}:${extra?.tag ?? ""}`, () => Prisma.sql`COUNT(*) FILTER (WHERE ${extra ? all([except(f), extra.sql]) : except(f)})::int`);
  const priceMin = column(`min:${signature("price")}`, () => Prisma.sql`MIN(b."price") FILTER (WHERE ${except("price")})::float`);
  const priceMax = column(`max:${signature("price")}`, () => Prisma.sql`MAX(b."price") FILTER (WHERE ${except("price")})::float`);
  const n = {
    types: counted("types"),
    platforms: counted("platforms"),
    regions: counted("regions"),
    years: counted("years"),
    genres: counted("genres"),
    languages: counted("languages"),
    scope: filters.category && scope.kind === "category" ? column("scope", () => Prisma.sql`COUNT(*) FILTER (WHERE b."f_category")::int`) : column(`count::`, () => Prisma.sql`COUNT(*)::int`),
    total: counted(null),
    stockBase: counted("inStock"),
    inStock: counted("inStock", { tag: "avail", sql: Prisma.sql`b."avail"` }),
    onSale: counted("onSale", { tag: "sale", sql: Prisma.sql`b."sale"` }),
    price: counted("price"),
    brand: params.brand ? counted("brand", { tag: "brand", sql: Prisma.sql`b."brand" = ${params.brand}` }) : null,
  };
  const live = all([ACTIVE, scopeSql]);

  const facetSql = Prisma.sql`
    WITH agg AS (
      SELECT GROUPING(b."t", b."pf", b."rg", b."yr", b."gs", b."ls")::int AS "gset", b."t", b."pf", b."rg", b."yr", b."gs", b."ls", ${Prisma.join(columns)}
      FROM (
        SELECT p."price"::float AS "price", p."brand", ${REDUCED} AS "sale", ${AVAILABLE} AS "avail",
          k."productType" AS "t", k."platform" AS "pf", k."region" AS "rg", k."releaseYear" AS "yr", k."genres" AS "gs", k."languages" AS "ls"
          ${flags}
        FROM "Product" p LEFT JOIN "KeyItem" k ON k."productId" = p."id"
        WHERE ${live}
        OFFSET 0
      ) b
      GROUP BY GROUPING SETS ((b."t"), (b."pf"), (b."rg"), (b."yr"), (b."gs"), (b."ls"), ())
    )
    SELECT 'types' AS "facet", "t" AS "key", ${n.types} AS "n", NULL::float AS "lo", NULL::float AS "hi" FROM agg WHERE "gset" = 31 AND "t" IS NOT NULL AND ${n.types} > 0
    UNION ALL SELECT 'platforms', "pf", ${n.platforms}, NULL, NULL FROM agg WHERE "gset" = 47 AND "pf" IS NOT NULL AND ${n.platforms} > 0
    UNION ALL SELECT 'regions', "rg", ${n.regions}, NULL, NULL FROM agg WHERE "gset" = 55 AND "rg" IS NOT NULL AND ${n.regions} > 0
    UNION ALL SELECT 'years', "yr"::text, ${n.years}, NULL, NULL FROM agg WHERE "gset" = 59 AND "yr" IS NOT NULL AND ${n.years} > 0
    UNION ALL SELECT 'genres', g, SUM(${n.genres})::int, NULL, NULL FROM agg, unnest("gs") g WHERE "gset" = 61 AND ${n.genres} > 0 GROUP BY g
    UNION ALL SELECT 'languages', l, SUM(${n.languages})::int, NULL, NULL FROM agg, unnest("ls") l WHERE "gset" = 62 AND ${n.languages} > 0 GROUP BY l
    UNION ALL SELECT 'scope', NULL, ${n.scope}, NULL, NULL FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'total', NULL, ${n.total}, NULL, NULL FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'stockBase', NULL, ${n.stockBase}, NULL, NULL FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'inStock', NULL, ${n.inStock}, NULL, NULL FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'onSale', NULL, ${n.onSale}, NULL, NULL FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'price', NULL, ${n.price}, ${priceMin}, ${priceMax} FROM agg WHERE "gset" = 63
    UNION ALL SELECT 'brand', NULL, ${n.brand ?? Prisma.sql`0`}, NULL, NULL FROM agg WHERE "gset" = 63`;

  const categorySql = categoryOptions.length
    ? Prisma.sql`
      SELECT ${Prisma.join(categoryOptions.map((o, i) => Prisma.sql`COUNT(*) FILTER (WHERE ${categoryCondition(tree.subtreeIds(o.category.id))})::int AS ${Prisma.raw(`"c${i}"`)}`))}
      FROM "Product" p LEFT JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${all([live, ...keys.filter((f) => f !== "category").map((f) => filters[f])])}`
    : null;

  const pageWhere = all([live, ...keys.map((f) => filters[f])]);
  const popularJoin = params.sort === "popular" ? Prisma.sql`LEFT JOIN (SELECT "productId", COUNT(*)::int AS "n" FROM "OrderItem" GROUP BY "productId") oc ON oc."productId" = p."id"` : Prisma.empty;
  const pageIdsAt = (page: number) =>
    prisma.$queryRaw<{ id: string }[]>`
      SELECT p."id" FROM "Product" p LEFT JOIN "KeyItem" k ON k."productId" = p."id" ${popularJoin}
      WHERE ${pageWhere}
      ORDER BY ${sortSql(params.sort, query)}
      LIMIT ${CATALOG_PAGE_SIZE} OFFSET ${(page - 1) * CATALOG_PAGE_SIZE}`;

  const [facetRows, categoryRows, firstIds] = await Promise.all([
    facetQuery<FacetRow>(facetSql),
    categorySql ? facetQuery<Record<string, number>>(categorySql) : Promise.resolve([] as Record<string, number>[]),
    pageIdsAt(params.page),
  ]);

  const single = (facet: string) => facetRows.find((r) => r.facet === facet);
  const total = single("total")?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const pageIds = page === params.page ? firstIds : await pageIdsAt(page);
  const products = await loadKeyProducts(pageIds.map((r) => r.id));

  const listFacet = (filter: ListFilter, label: (key: string) => string, order: (key: string) => number, keyOf: (raw: string) => string = (raw) => raw): FacetOption[] => {
    const counts = new Map<string, { count: number; label: string }>();
    for (const row of facetRows) {
      if (row.facet !== filter || row.key === null) continue;
      const key = keyOf(row.key);
      const entry = counts.get(key);
      if (entry) entry.count += row.n;
      else counts.set(key, { count: row.n, label: filter === "languages" ? row.key : label(key) });
    }
    const options: FacetOption[] = [...counts.entries()].map(([key, { count, label: l }]) => ({ key, label: l, count, selected: params[filter].includes(key) }));
    for (const key of params[filter]) if (!counts.has(key)) options.push({ key, label: key, count: 0, selected: true });
    return options.sort((a, b) => order(a.key) - order(b.key) || a.label.localeCompare(b.label, "en-GB"));
  };

  const categories: CategoryOption[] = categoryOptions
    .map((o, i) => ({ key: o.category.slug, name: o.name, count: categoryRows[0]?.[`c${i}`] ?? 0, href: o.href, active: o.active, depth: o.depth }))
    .filter((o) => o.count > 0 || o.active);
  const brandRow = single("brand");
  const priceRow = single("price");
  const stockBase = single("stockBase")?.n ?? 0;
  const inStockCount = single("inStock")?.n ?? 0;

  return {
    products,
    total,
    page,
    totalPages,
    pageSize: CATALOG_PAGE_SIZE,
    scopeTotal: single("scope")?.n ?? 0,
    activeCategoryName: paramCategory?.name ?? null,
    facets: {
      categoryTitle,
      categories,
      brands: params.brand ? [{ name: params.brand, count: brandRow?.n ?? 0 }] : [],
      price: priceRow && priceRow.n > 0 && priceRow.lo !== null && priceRow.hi !== null ? { min: priceRow.lo, max: priceRow.hi } : null,
      inStockCount,
      onSaleCount: single("onSale")?.n ?? 0,
      narrowingInStock: inStockCount > 0 && inStockCount < stockBase,
      types: listFacet("types", (key) => productTypeDef(key)?.label ?? key, (key) => PRODUCT_TYPES.findIndex((t) => t.key === key)),
      platforms: listFacet("platforms", (key) => platformDef(key)?.label ?? key, (key) => PLATFORMS.findIndex((p) => p.key === key)),
      regions: listFacet("regions", (key) => regionDef(key)?.label ?? key, (key) => REGIONS.findIndex((r) => r.key === key)),
      genres: listFacet("genres", (key) => genreDef(key)?.label ?? key, (key) => GENRES.findIndex((g) => g.key === key)),
      languages: listFacet("languages", (key) => key, (key) => (key === "english" ? -1 : 0), slugify),
      years: listFacet("years", (key) => key, (key) => -Number(key)),
    },
  };
}

export interface CategoryStats {
  count: number;
  inStock: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export async function categoryStats(categoryIds: string[]): Promise<CategoryStats> {
  const [row] = await prisma.$queryRaw<{ count: number; inStock: number; min: number | null; max: number | null }[]>`
    SELECT COUNT(*)::int AS "count", COUNT(*) FILTER (WHERE ${AVAILABLE})::int AS "inStock", MIN(p."price")::float AS "min", MAX(p."price")::float AS "max"
    FROM "Product" p LEFT JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE ${ACTIVE} AND ${categoryCondition(categoryIds)}`;
  return { count: row?.count ?? 0, inStock: row?.inStock ?? 0, minPrice: row?.min ?? null, maxPrice: row?.max ?? null };
}

let countsCache: { at: number; ids: string; value: Promise<Map<string, number>> } | null = null;

export function categoryCounts(tree: CategoryTree): Promise<Map<string, number>> {
  const ids = tree.all.map((c) => c.id).join(",");
  if (countsCache && countsCache.ids === ids && Date.now() - countsCache.at < 60_000) return countsCache.value;
  const value = computeCategoryCounts(tree);
  countsCache = { at: Date.now(), ids, value };
  value.catch(() => {
    if (countsCache?.value === value) countsCache = null;
  });
  return value;
}

async function computeCategoryCounts(tree: CategoryTree): Promise<Map<string, number>> {
  if (tree.all.length === 0) return new Map();
  const synced = tree.all.filter((c) => tree.subtreeIds(c.id).every((id) => SYNC_CATEGORIES.has(id)));
  const manual = tree.all.filter((c) => !synced.includes(c));
  const pairs = manual.flatMap((c) => tree.subtreeIds(c.id).map((member) => Prisma.sql`(${c.id}, ${member})`));
  const [groups, manualRows] = await Promise.all([
    prisma.$queryRaw<{ type: string; platform: string; n: number }[]>`
      SELECT k."productType" AS "type", k."platform", COUNT(*)::int AS "n"
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${ACTIVE}
      GROUP BY 1, 2`,
    pairs.length
      ? prisma.$queryRaw<{ id: string; n: number }[]>`
        SELECT t."root" AS "id", COUNT(DISTINCT pc."productId")::int AS "n"
        FROM (VALUES ${Prisma.join(pairs)}) AS t("root", "member")
        JOIN "ProductCategory" pc ON pc."categoryId" = t."member"
        JOIN "Product" p ON p."id" = pc."productId"
        WHERE ${ACTIVE}
        GROUP BY t."root"`
      : Promise.resolve([] as { id: string; n: number }[]),
  ]);
  const counts = new Map(manualRows.map((r) => [r.id, r.n]));
  for (const c of synced) {
    const members = tree.subtreeIds(c.id).map((id) => SYNC_CATEGORIES.get(id)!);
    const types = new Set(members.filter((m) => !m.platform).map((m) => m.type));
    const leaves = new Set(members.filter((m) => m.platform && !types.has(m.type)).map((m) => `${m.type}/${m.platform}`));
    counts.set(c.id, groups.filter((g) => types.has(g.type) || leaves.has(`${g.type}/${g.platform}`)).reduce((sum, g) => sum + g.n, 0));
  }
  for (const c of tree.all) if (!counts.has(c.id)) counts.set(c.id, 0);
  return counts;
}
