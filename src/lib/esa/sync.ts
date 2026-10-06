import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { catalogConfig, quotaTotal } from "@/config/catalog";
import { slugify } from "@/lib/utils/slugify";
import { PLATFORMS, PRODUCT_TYPES, categorySlugFor, platformDef, productTypeDef, regionDef } from "@/lib/keys/taxonomy";
import { esaClient } from "./client";
import { stableHash } from "./classify";
import { buildCandidates, selectCatalog, type Candidate, type CandidateStats } from "./select";
import { mediaId, mediaPath } from "./media";
import type { EsaProduct } from "./types";

export type CatalogSource = () => Promise<EsaProduct[]>;

export interface SyncResult {
  runId: string;
  source: string;
  stats: CandidateStats;
  selected: number;
  created: number;
  updated: number;
  archived: number;
  onSale: number;
  byType: Record<string, number>;
  byPlatform: Record<string, number>;
  warnings: string[];
  durationMs: number;
}

interface PricePoint {
  at: string;
  price: number;
}

const HISTORY_DAYS = 30;
const SALE_THRESHOLD = 0.9;

export function productIdFor(dedupeKey: string): string {
  return `kp_${stableHash(dedupeKey).slice(0, 24)}`;
}

export function skuFor(dedupeKey: string): string {
  return `KR-${stableHash(dedupeKey).slice(0, 10).toUpperCase()}`;
}

function firstSentence(text: string): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const sentence = flat.split(/(?<=[.!?])\s/)[0];
  return sentence.length <= 180 && /[.!?]$/.test(sentence) ? sentence : null;
}

function factualDescription(c: Candidate): string {
  const type = productTypeDef(c.productType)!;
  const platform = platformDef(c.platform)!;
  const region = regionDef(c.region)!;
  const lines = [`${c.title} — ${type.singular.toLowerCase()} for ${platform.label}. ${region.note}`];
  if (c.validity) lines.push(`Duration: ${c.validity}.`);
  if (c.faceValue && c.faceCurrency) lines.push(`Card value: ${c.faceValue} ${c.faceCurrency}.`);
  lines.push(`Redeem it with ${platform.account}.`);
  return lines.join(" ");
}

export async function fetchAllProducts(options: { maxPages?: number | null; onPage?: (page: number, total: number) => void } = {}): Promise<EsaProduct[]> {
  const { pageSize, concurrency } = catalogConfig.sync;
  const maxPages = options.maxPages ?? catalogConfig.sync.maxPages;
  const first = await esaClient.listProducts({ page: 1, limit: pageSize });
  const totalPages = Math.max(1, Math.ceil(first.itemCount / pageSize));
  const lastPage = maxPages ? Math.min(totalPages, maxPages) : totalPages;
  const products = [...first.results];
  options.onPage?.(1, lastPage);
  let next = 2;
  const worker = async () => {
    while (next <= lastPage) {
      const page = next++;
      const result = await esaClient.listProducts({ page, limit: pageSize });
      products.push(...result.results);
      options.onPage?.(page, lastPage);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return products;
}

async function ensureCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [typeIndex, type] of PRODUCT_TYPES.entries()) {
    const root = await prisma.category.upsert({
      where: { slug: type.slug },
      create: { id: `cat_${type.slug}`, name: type.label, slug: type.slug, description: type.lead, sortOrder: typeIndex, isActive: true },
      update: { name: type.label, description: type.lead, parentId: null, sortOrder: typeIndex },
      select: { id: true },
    });
    ids.set(type.key, root.id);
    for (const [platformIndex, platform] of PLATFORMS.entries()) {
      const slug = categorySlugFor(type.key, platform.key);
      const child = await prisma.category.upsert({
        where: { slug },
        create: { id: `cat_${slug}`, name: platform.label, slug, description: `${type.label} for ${platform.label}.`, parentId: root.id, sortOrder: platformIndex, isActive: true },
        update: { name: platform.label, description: `${type.label} for ${platform.label}.`, parentId: root.id, sortOrder: platformIndex },
        select: { id: true },
      });
      ids.set(`${type.key}/${platform.key}`, child.id);
    }
  }
  return ids;
}

interface Existing {
  slug: string;
  status: string;
  priceLog: PricePoint[];
}

function nextPriceLog(previous: PricePoint[], price: number, now: Date): { log: PricePoint[]; compare: number | null } {
  const cutoff = now.getTime() - HISTORY_DAYS * 86_400_000;
  const recent = previous.filter((p) => new Date(p.at).getTime() >= cutoff && Number.isFinite(p.price));
  const reference = recent.length ? Math.min(...recent.map((p) => p.price)) : null;
  const last = recent[recent.length - 1];
  const log = last && Math.abs(last.price - price) < 0.005 ? recent : [...recent, { at: now.toISOString(), price }];
  const compare = reference !== null && price <= reference * SALE_THRESHOLD ? reference : null;
  return { log: log.slice(-40), compare };
}

async function writeChunk(chunk: Candidate[], categories: Map<string, string>, slugs: Map<string, string>, existing: Map<string, Existing>, now: Date): Promise<number> {
  let onSale = 0;
  const pricing = new Map<string, { log: PricePoint[]; compare: number | null }>();
  for (const c of chunk) {
    const next = nextPriceLog(existing.get(c.dedupeKey)?.priceLog ?? [], c.sell, now);
    if (next.compare !== null) onSale++;
    pricing.set(c.dedupeKey, next);
  }

  const products = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    const description = c.description || factualDescription(c);
    const meta = `${c.displayName}. ${regionDef(c.region)!.label} activation on ${platformDef(c.platform)!.label}.`;
    return Prisma.sql`(${id}, ${c.displayName}, ${slugs.get(c.dedupeKey)!}, ${skuFor(c.dedupeKey)}, ${description}, ${firstSentence(description)}, ${c.sell}, ${pricing.get(c.dedupeKey)!.compare}, ${c.cost}, true, ${c.qty}, 0, 'ACTIVE'::"ProductStatus", false, 'new', ${c.publishers[0] ?? null}, ${meta.slice(0, 300)}, ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "Product" ("id", "name", "slug", "sku", "description", "shortDescription", "price", "comparePrice", "costPrice", "trackInventory", "quantity", "lowStockAlert", "status", "isFeatured", "condition", "brand", "metaDescription", "createdAt", "updatedAt")
    VALUES ${Prisma.join(products)}
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "shortDescription" = EXCLUDED."shortDescription",
      "price" = EXCLUDED."price",
      "comparePrice" = EXCLUDED."comparePrice",
      "costPrice" = EXCLUDED."costPrice",
      "quantity" = EXCLUDED."quantity",
      "brand" = EXCLUDED."brand",
      "metaDescription" = EXCLUDED."metaDescription",
      "status" = 'ACTIVE'::"ProductStatus",
      "updatedAt" = EXCLUDED."updatedAt"`;

  const ids = chunk.map((c) => productIdFor(c.dedupeKey));
  await prisma.$executeRaw`DELETE FROM "ProductImage" WHERE "productId" = ANY(${ids})`;
  const media = new Map<string, string>();
  const images = chunk.flatMap((c) => {
    const id = productIdFor(c.dedupeKey);
    return [c.cover, ...c.screenshots].map((url, index) => {
      media.set(mediaId(url), url);
      return Prisma.sql`(${`img_${id.slice(3)}_${index}`}, ${mediaPath(url)}, ${index === 0 ? c.title : `${c.title} screenshot ${index}`}, ${index}, ${id})`;
    });
  });
  await prisma.$executeRaw`INSERT INTO "ProductImage" ("id", "url", "alt", "sortOrder", "productId") VALUES ${Prisma.join(images)}`;
  const mediaRows = [...media.entries()].map(([hash, url]) => Prisma.sql`(${hash}, ${url}, ${now})`);
  await prisma.$executeRaw`INSERT INTO "MediaSource" ("id", "url", "createdAt") VALUES ${Prisma.join(mediaRows)} ON CONFLICT ("id") DO UPDATE SET "url" = EXCLUDED."url"`;

  await prisma.$executeRaw`DELETE FROM "ProductCategory" WHERE "productId" = ANY(${ids})`;
  const links = chunk.flatMap((c) => {
    const id = productIdFor(c.dedupeKey);
    return [Prisma.sql`(${id}, ${categories.get(c.productType)!})`, Prisma.sql`(${id}, ${categories.get(`${c.productType}/${c.platform}`)!})`];
  });
  await prisma.$executeRaw`INSERT INTO "ProductCategory" ("productId", "categoryId") VALUES ${Prisma.join(links)} ON CONFLICT DO NOTHING`;

  const items = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    return Prisma.sql`(${`ki_${id.slice(3)}`}, ${id}, ${c.dedupeKey}, ${c.title}, ${c.productType}, ${c.platform}, ${c.region}, ${c.regionNote}, ${c.languages}::text[], ${c.genres}::text[], ${c.releaseDate}, ${c.releaseYear}, ${c.developers}::text[], ${c.publishers}::text[], ${c.ageRating}, ${c.edition}, ${c.systemRequirements ? JSON.stringify(c.systemRequirements) : null}::jsonb, ${c.activationNotes}, ${c.metacriticScore}, ${c.videoId}, ${c.faceValue}, ${c.faceCurrency}, ${c.validity}, ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "KeyItem" ("id", "productId", "dedupeKey", "title", "productType", "platform", "region", "regionNote", "languages", "genres", "releaseDate", "releaseYear", "developers", "publishers", "ageRating", "edition", "systemRequirements", "activationNotes", "metacriticScore", "videoId", "faceValue", "faceCurrency", "validity", "createdAt", "updatedAt")
    VALUES ${Prisma.join(items)}
    ON CONFLICT ("dedupeKey") DO UPDATE SET
      "productId" = EXCLUDED."productId",
      "title" = EXCLUDED."title",
      "regionNote" = EXCLUDED."regionNote",
      "languages" = EXCLUDED."languages",
      "genres" = EXCLUDED."genres",
      "releaseDate" = EXCLUDED."releaseDate",
      "releaseYear" = EXCLUDED."releaseYear",
      "developers" = EXCLUDED."developers",
      "publishers" = EXCLUDED."publishers",
      "ageRating" = EXCLUDED."ageRating",
      "edition" = EXCLUDED."edition",
      "systemRequirements" = EXCLUDED."systemRequirements",
      "activationNotes" = EXCLUDED."activationNotes",
      "metacriticScore" = EXCLUDED."metacriticScore",
      "videoId" = EXCLUDED."videoId",
      "faceValue" = EXCLUDED."faceValue",
      "faceCurrency" = EXCLUDED."faceCurrency",
      "validity" = EXCLUDED."validity",
      "updatedAt" = EXCLUDED."updatedAt"`;

  const esaIds = chunk.map((c) => c.esaId);
  const esaProductIds = chunk.map((c) => c.esaProductId);
  await prisma.$executeRaw`DELETE FROM "SupplyItem" WHERE ("esaId" = ANY(${esaIds}) OR "esaProductId" = ANY(${esaProductIds})) AND NOT ("productId" = ANY(${ids}))`;
  const supply = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    return Prisma.sql`(${`su_${id.slice(3)}`}, ${id}, ${c.esaProductId}, ${c.esaId}, ${c.offerId}, ${c.cost}, ${c.sell}, ${c.qty}, ${c.offers}, ${c.rawName}, ${c.rawPlatform}, ${c.rawRegion}, ${c.regionId}, ${JSON.stringify(c.alternates)}::jsonb, ${JSON.stringify(pricing.get(c.dedupeKey)!.log)}::jsonb, true, ${now}, ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "SupplyItem" ("id", "productId", "esaProductId", "esaId", "offerId", "costPrice", "sellPrice", "qty", "offers", "rawName", "rawPlatform", "rawRegion", "regionId", "alternates", "priceLog", "isAvailable", "syncedAt", "createdAt", "updatedAt")
    VALUES ${Prisma.join(supply)}
    ON CONFLICT ("productId") DO UPDATE SET
      "esaProductId" = EXCLUDED."esaProductId",
      "esaId" = EXCLUDED."esaId",
      "offerId" = EXCLUDED."offerId",
      "costPrice" = EXCLUDED."costPrice",
      "sellPrice" = EXCLUDED."sellPrice",
      "qty" = EXCLUDED."qty",
      "offers" = EXCLUDED."offers",
      "rawName" = EXCLUDED."rawName",
      "rawPlatform" = EXCLUDED."rawPlatform",
      "rawRegion" = EXCLUDED."rawRegion",
      "regionId" = EXCLUDED."regionId",
      "alternates" = EXCLUDED."alternates",
      "priceLog" = EXCLUDED."priceLog",
      "isAvailable" = true,
      "syncedAt" = EXCLUDED."syncedAt",
      "updatedAt" = EXCLUDED."updatedAt"`;
  return onSale;
}

function assignSlugs(selected: Candidate[], existing: Map<string, Existing>, taken: Set<string>): Map<string, string> {
  const slugs = new Map<string, string>();
  for (const c of selected) {
    const current = existing.get(c.dedupeKey)?.slug;
    if (current) {
      slugs.set(c.dedupeKey, current);
      continue;
    }
    const base = slugify(c.displayName.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[™®©]/g, "").replace(/&/g, " and ")).replace(/-{2,}/g, "-").slice(0, 90).replace(/-+$/, "");
    let slug = base || productIdFor(c.dedupeKey);
    if (taken.has(slug)) slug = `${slug}-${stableHash(c.dedupeKey).slice(0, 6)}`;
    taken.add(slug);
    slugs.set(c.dedupeKey, slug);
  }
  return slugs;
}

export async function syncCatalog(options: { source?: CatalogSource; label?: string; now?: Date } = {}): Promise<SyncResult> {
  const t0 = Date.now();
  const sourceLabel = options.label ?? "live";
  const run = await prisma.catalogSyncRun.create({ data: { source: sourceLabel } });

  try {
    const now = options.now ?? new Date();
    const products = await (options.source ?? (() => fetchAllProducts()))();
    if (products.length === 0) throw new Error("Supplier catalogue is empty — nothing was changed");
    const { candidates, stats } = buildCandidates(products, { margin: env.CATALOG_MARGIN, minMarginAbs: env.CATALOG_MIN_MARGIN_ABS });

    const rows = await prisma.keyItem.findMany({
      select: { dedupeKey: true, product: { select: { slug: true, status: true, supply: { select: { priceLog: true } } } } },
    });
    const existing = new Map<string, Existing>(
      rows.map((r) => [r.dedupeKey, { slug: r.product.slug, status: r.product.status, priceLog: Array.isArray(r.product.supply?.priceLog) ? (r.product.supply!.priceLog as unknown as PricePoint[]) : [] }]),
    );
    const active = new Set(rows.filter((r) => r.product.status === "ACTIVE").map((r) => r.dedupeKey));
    const selected = selectCatalog(candidates, active);
    const warnings: string[] = [];
    if (selected.length < catalogConfig.target.min) {
      warnings.push(`Selected ${selected.length} products, below the target minimum of ${catalogConfig.target.min} (quota total ${quotaTotal()}).`);
    }

    const categories = await ensureCategories();
    const takenRows = await prisma.product.findMany({ select: { slug: true } });
    const slugs = assignSlugs(selected, existing, new Set(takenRows.map((r) => r.slug)));
    let onSale = 0;
    for (let i = 0; i < selected.length; i += catalogConfig.sync.chunkSize) {
      onSale += await writeChunk(selected.slice(i, i + catalogConfig.sync.chunkSize), categories, slugs, existing, now);
    }

    const selectedIds = selected.map((c) => productIdFor(c.dedupeKey));
    const created = selected.filter((c) => !existing.has(c.dedupeKey)).length;
    const archived = await prisma.$executeRaw`
      UPDATE "Product" SET "status" = 'ARCHIVED'::"ProductStatus", "quantity" = 0, "comparePrice" = NULL, "updatedAt" = now()
      WHERE "id" IN (SELECT "productId" FROM "KeyItem")
        AND "status" <> 'ARCHIVED'::"ProductStatus"
        AND NOT ("id" = ANY(${selectedIds}))`;
    await prisma.$executeRaw`
      UPDATE "SupplyItem" SET "isAvailable" = false, "qty" = 0, "updatedAt" = now()
      WHERE NOT ("productId" = ANY(${selectedIds})) AND "isAvailable" = true`;
    await prisma.$executeRaw`
      UPDATE "Category" c SET "isActive" = EXISTS (
        SELECT 1 FROM "ProductCategory" pc JOIN "Product" p ON p."id" = pc."productId"
        WHERE pc."categoryId" = c."id" AND p."status" = 'ACTIVE'::"ProductStatus"
      ), "updatedAt" = now()
      WHERE c."id" LIKE 'cat\\_%'`;

    const byType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    for (const c of selected) {
      byType[c.productType] = (byType[c.productType] ?? 0) + 1;
      byPlatform[c.platform] = (byPlatform[c.platform] ?? 0) + 1;
    }

    const result: SyncResult = {
      runId: run.id,
      source: sourceLabel,
      stats,
      selected: selected.length,
      created,
      updated: selected.length - created,
      archived: Number(archived),
      onSale,
      byType,
      byPlatform,
      warnings,
      durationMs: Date.now() - t0,
    };
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: warnings.length ? "warning" : "ok",
        fetched: stats.products,
        eligible: stats.eligible,
        selected: result.selected,
        created: result.created,
        updated: result.updated,
        archived: result.archived,
        error: warnings.join(" ") || null,
        finishedAt: new Date(),
      },
    });
    console.log(`[catalog-sync] source=${sourceLabel} products=${stats.products} groups=${stats.groups} eligible=${stats.eligible} selected=${result.selected} created=${created} archived=${result.archived} in ${result.durationMs}ms`);
    return result;
  } catch (err) {
    await prisma.catalogSyncRun
      .update({ where: { id: run.id }, data: { status: "failed", error: err instanceof Error ? err.message : String(err), finishedAt: new Date() } })
      .catch(() => {});
    throw err;
  }
}
