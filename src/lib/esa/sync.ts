import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { catalogConfig, quotaTotal } from "@/config/catalog";
import { STORE_POLICY } from "@/config/store-policy";
import { slugify } from "@/lib/utils/slugify";
import { PLATFORMS, PRODUCT_TYPES, categorySlugFor, platformDef, productTypeDef, regionDef } from "@/lib/keys/taxonomy";
import { esaClient } from "./client";
import { classifyProduct, stableHash, type Classified, type RejectReason } from "./classify";
import { buildCandidates, liteOf, selectCatalog, type CandidateStats, type LiteItem } from "./select";
import { Staging, type PageStats, type StagingManifest, type StoredSelection } from "./staging";
import { mediaId, mediaPath } from "./media";
import type { EsaProduct } from "./types";

export type CatalogSource =
  | { id: string; label: string; kind: "paged"; first: () => Promise<{ products: EsaProduct[]; itemCount: number }>; page: (page: number) => Promise<EsaProduct[]>; maxPages?: number | null }
  | { id: string; label: string; kind: "stream"; pages: () => AsyncIterable<EsaProduct[]> };

export interface SyncOptions {
  source?: CatalogSource;
  fresh?: boolean;
  keepStaging?: boolean;
  now?: Date;
  log?: (line: string) => void;
}

export interface SyncResult {
  runId: string;
  source: string;
  resumed: boolean;
  stats: CandidateStats;
  selected: number;
  created: number;
  updated: number;
  archived: number;
  onSale: number;
  byType: Record<string, number>;
  byPlatform: Record<string, number>;
  warnings: string[];
  timings: { fetchMs: number; selectMs: number; writeMs: number; finalizeMs: number };
  durationMs: number;
}

interface PricePoint {
  at: string;
  price: number;
}

const HISTORY_DAYS = STORE_POLICY.deals.compareWindowDays;
const SALE_THRESHOLD = 1 - STORE_POLICY.deals.minPercent / 100;

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

type Selected = StoredSelection["candidates"][number];
type WriteRow = Classified & { sell: number; alternates: Selected["alternates"] };
type Tx = Pick<typeof prisma, "$executeRaw">;

function factualDescription(c: WriteRow): string {
  const type = productTypeDef(c.productType)!;
  const platform = platformDef(c.platform)!;
  const region = regionDef(c.region)!;
  const lines = [`${c.title} — ${type.singular.toLowerCase()} for ${platform.label}. ${region.note}`];
  if (c.validity) lines.push(`Duration: ${c.validity}.`);
  if (c.faceValue && c.faceCurrency) lines.push(`Card value: ${c.faceValue} ${c.faceCurrency}.`);
  lines.push(`Redeem it with ${platform.account}.`);
  return lines.join(" ");
}

export function liveSource(options: { maxPages?: number | null } = {}): CatalogSource {
  const limit = catalogConfig.sync.pageSize;
  return {
    id: `live:${env.KINGUIN_API_BASE}`,
    label: "live",
    kind: "paged",
    maxPages: options.maxPages ?? catalogConfig.sync.maxPages,
    first: async () => {
      const result = await esaClient.listProducts({ page: 1, limit });
      return { products: result.results, itemCount: result.itemCount };
    },
    page: async (page) => (await esaClient.listProducts({ page, limit })).results,
  };
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
  priceLog: PricePoint[];
}

function nextPriceLog(previous: PricePoint[], price: number, now: Date): { log: PricePoint[]; compare: number | null } {
  const day = 86_400_000;
  const kept = previous.filter((p) => new Date(p.at).getTime() >= now.getTime() - 2 * HISTORY_DAYS * day && Number.isFinite(p.price));
  const last = kept[kept.length - 1];
  const log = last && Math.abs(last.price - price) < 0.005 ? kept : [...kept, { at: now.toISOString(), price }];
  let start = log.length - 1;
  while (start > 0 && Math.abs(log[start - 1].price - price) < 0.005) start--;
  const since = new Date(log[start].at).getTime();
  const before = log.slice(0, start).filter((p) => new Date(p.at).getTime() >= since - HISTORY_DAYS * day);
  const reference = before.length ? Math.min(...before.map((p) => p.price)) : null;
  const current = now.getTime() - since <= HISTORY_DAYS * day;
  const compare = current && reference !== null && price <= reference * SALE_THRESHOLD ? reference : null;
  return { log: log.slice(-60), compare };
}

async function existingFor(keys: string[]): Promise<Map<string, Existing>> {
  const rows = await prisma.$queryRaw<{ dedupeKey: string; slug: string; priceLog: unknown }[]>`
    SELECT k."dedupeKey", p."slug", s."priceLog"
    FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId" LEFT JOIN "SupplyItem" s ON s."productId" = p."id"
    WHERE k."dedupeKey" = ANY(${keys})`;
  return new Map(rows.map((r) => [r.dedupeKey, { slug: r.slug, priceLog: Array.isArray(r.priceLog) ? (r.priceLog as PricePoint[]) : [] }]));
}

function slugFor(c: WriteRow, existing: Existing | undefined, taken: Set<string>): string {
  if (existing) return existing.slug;
  const base = slugify(c.displayName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[™®©]/g, "").replace(/&/g, " and ")).replace(/-{2,}/g, "-").slice(0, 90).replace(/-+$/, "");
  let slug = base || productIdFor(c.dedupeKey);
  if (taken.has(slug)) slug = `${slug}-${stableHash(c.dedupeKey).slice(0, 6)}`;
  taken.add(slug);
  return slug;
}

async function writeChunk(tx: Tx, chunk: WriteRow[], categories: Map<string, string>, existing: Map<string, Existing>, taken: Set<string>, now: Date): Promise<number> {
  let onSale = 0;
  const pricing = new Map<string, { log: PricePoint[]; compare: number | null }>();
  const slugs = new Map<string, string>();
  for (const c of chunk) {
    const next = nextPriceLog(existing.get(c.dedupeKey)?.priceLog ?? [], c.sell, now);
    if (next.compare !== null) onSale++;
    pricing.set(c.dedupeKey, next);
    slugs.set(c.dedupeKey, slugFor(c, existing.get(c.dedupeKey), taken));
  }

  const products = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    const description = c.description || factualDescription(c);
    const meta = `${c.displayName}. ${regionDef(c.region)!.label} activation on ${platformDef(c.platform)!.label}.`;
    return Prisma.sql`(${id}, ${c.displayName}, ${slugs.get(c.dedupeKey)!}, ${skuFor(c.dedupeKey)}, ${description}, ${firstSentence(description)}, ${c.sell}, ${pricing.get(c.dedupeKey)!.compare}, ${c.cost}, true, ${c.qty}, 0, 'ACTIVE'::"ProductStatus", false, 'new', ${c.publishers[0] ?? null}, ${meta.slice(0, 300)}, ${now}, ${now})`;
  });
  await tx.$executeRaw`
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
  await tx.$executeRaw`DELETE FROM "ProductImage" WHERE "productId" = ANY(${ids})`;
  const media = new Map<string, string>();
  const images = chunk.flatMap((c) => {
    const id = productIdFor(c.dedupeKey);
    return [c.cover, ...c.screenshots].map((url, index) => {
      media.set(mediaId(url), url);
      return Prisma.sql`(${`img_${id.slice(3)}_${index}`}, ${mediaPath(url)}, ${index === 0 ? c.title : `${c.title} screenshot ${index}`}, ${index}, ${id})`;
    });
  });
  await tx.$executeRaw`INSERT INTO "ProductImage" ("id", "url", "alt", "sortOrder", "productId") VALUES ${Prisma.join(images)}`;
  const mediaRows = [...media.entries()].map(([hash, url]) => Prisma.sql`(${hash}, ${url}, ${now})`);
  await tx.$executeRaw`INSERT INTO "MediaSource" ("id", "url", "createdAt") VALUES ${Prisma.join(mediaRows)} ON CONFLICT ("id") DO UPDATE SET "url" = EXCLUDED."url"`;

  await tx.$executeRaw`DELETE FROM "ProductCategory" WHERE "productId" = ANY(${ids})`;
  const links = chunk.flatMap((c) => {
    const id = productIdFor(c.dedupeKey);
    return [Prisma.sql`(${id}, ${categories.get(c.productType)!})`, Prisma.sql`(${id}, ${categories.get(`${c.productType}/${c.platform}`)!})`];
  });
  await tx.$executeRaw`INSERT INTO "ProductCategory" ("productId", "categoryId") VALUES ${Prisma.join(links)} ON CONFLICT DO NOTHING`;

  const items = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    return Prisma.sql`(${`ki_${id.slice(3)}`}, ${id}, ${c.dedupeKey}, ${c.title}, ${c.productType}, ${c.platform}, ${c.region}, ${c.regionNote}, ${c.languages}::text[], ${c.genres}::text[], ${c.releaseDate}, ${c.releaseYear}, ${c.developers}::text[], ${c.publishers}::text[], ${c.ageRating}, ${c.edition}, ${c.systemRequirements ? JSON.stringify(c.systemRequirements) : null}::jsonb, ${c.activationNotes}, ${c.metacriticScore}, ${c.videoId}, ${c.faceValue}, ${c.faceCurrency}, ${c.validity}, ${now}, ${now})`;
  });
  await tx.$executeRaw`
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
  await tx.$executeRaw`DELETE FROM "SupplyItem" WHERE ("esaId" = ANY(${esaIds}) OR "esaProductId" = ANY(${esaProductIds})) AND NOT ("productId" = ANY(${ids}))`;
  const supply = chunk.map((c) => {
    const id = productIdFor(c.dedupeKey);
    return Prisma.sql`(${`su_${id.slice(3)}`}, ${id}, ${c.esaProductId}, ${c.esaId}, ${c.offerId}, ${c.cost}, ${c.sell}, ${c.qty}, ${c.offers}, ${c.rawName}, ${c.rawPlatform}, ${c.rawRegion}, ${c.regionId}, ${JSON.stringify(c.alternates)}::jsonb, ${JSON.stringify(pricing.get(c.dedupeKey)!.log)}::jsonb, true, ${now}, ${now}, ${now})`;
  });
  await tx.$executeRaw`
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

export async function refreshPlannerStats(): Promise<void> {
  for (const table of ["Product", "KeyItem", "ProductCategory", "ProductImage", "SupplyItem", "OrderItem"]) {
    await prisma.$executeRawUnsafe(`VACUUM (ANALYZE) "${table}"`).catch(() => prisma.$executeRawUnsafe(`ANALYZE "${table}"`));
  }
}

function classifyPage(page: number, products: EsaProduct[]): { items: Classified[]; stats: PageStats } {
  const rejected: Partial<Record<RejectReason, number>> = {};
  const items: Classified[] = [];
  for (const product of products) {
    const result = classifyProduct(product);
    if (result.ok) items.push(result.item);
    else rejected[result.reason] = (rejected[result.reason] ?? 0) + 1;
  }
  return { items, stats: { page, products: products.length, ids: products.map((p) => p.kinguinId), rejected } };
}

function eta(done: number, total: number, startedAt: number): string {
  const elapsed = (Date.now() - startedAt) / 1000;
  if (done === 0 || elapsed < 1) return "";
  const left = Math.max(0, ((total - done) * elapsed) / done);
  return ` · ${(done / elapsed).toFixed(1)}/s · eta ${left >= 90 ? `${Math.round(left / 60)}m` : `${Math.round(left)}s`}`;
}

async function fetchIntoStaging(source: CatalogSource, staging: Staging, manifest: StagingManifest, log: (line: string) => void): Promise<void> {
  const done = new Set(manifest.pagesDone);
  const staged = done.size;
  const startedAt = Date.now();
  let fetchedNow = 0;
  let lastLog = 0;
  let lastCount = -1;
  const progress = (total: number | null) => {
    const count = done.size;
    if (count === lastCount || (Date.now() - lastLog < 2000 && count !== total)) return;
    lastLog = Date.now();
    lastCount = count;
    log(`[catalog-sync] fetch ${count}${total ? `/${total}` : ""} pages${total ? eta(fetchedNow, total - (count - fetchedNow), startedAt) : ""}`);
  };
  const store = (page: number, products: EsaProduct[]) => {
    const { items, stats } = classifyPage(page, products);
    staging.savePage(page, items, stats);
    done.add(page);
    fetchedNow++;
    manifest.pagesDone = [...done].sort((a, b) => a - b);
    staging.saveManifest(manifest);
  };

  if (source.kind === "stream") {
    let page = 0;
    for await (const products of source.pages()) {
      page++;
      if (done.has(page)) continue;
      store(page, products);
      progress(null);
    }
    manifest.totalPages = page;
  } else {
    const pageSize = catalogConfig.sync.pageSize;
    if (!done.has(1) || manifest.totalPages === null) {
      const first = await source.first();
      manifest.itemCount = first.itemCount;
      const totalPages = Math.max(1, Math.ceil(first.itemCount / pageSize));
      manifest.totalPages = source.maxPages ? Math.min(totalPages, source.maxPages) : totalPages;
      if (!done.has(1)) store(1, first.products);
      else staging.saveManifest(manifest);
      log(`[catalog-sync] supplier reports ${first.itemCount.toLocaleString("en-GB")} products in ${totalPages} pages${source.maxPages ? `, fetching ${manifest.totalPages}` : ""}`);
    }
    const total = manifest.totalPages!;
    const queue = Array.from({ length: total }, (_, i) => i + 1).filter((page) => !done.has(page));
    if (staged) log(`[catalog-sync] resuming: ${staged}/${total} pages already staged`);
    const worker = async () => {
      for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
        store(page, await source.page(page));
        progress(total);
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, catalogConfig.sync.concurrency) }, worker));
  }
  manifest.fetchComplete = true;
  staging.saveManifest(manifest);
  progress(manifest.totalPages);
}

async function loadLite(staging: Staging): Promise<{ lite: LiteItem[]; products: number; rejected: Partial<Record<RejectReason, number>> }> {
  const rejected: Partial<Record<RejectReason, number>> = {};
  let products = 0;
  for (const page of staging.pages()) {
    const stats = staging.pageStats(page);
    products += stats.products;
    for (const [reason, n] of Object.entries(stats.rejected) as [RejectReason, number][]) rejected[reason] = (rejected[reason] ?? 0) + n;
  }
  const seen = new Set<number>();
  const lite: LiteItem[] = [];
  for await (const item of staging.items()) {
    if (seen.has(item.esaId)) continue;
    seen.add(item.esaId);
    lite.push(liteOf(item));
  }
  return { lite, products, rejected };
}

export async function syncCatalog(options: SyncOptions = {}): Promise<SyncResult> {
  const t0 = Date.now();
  const log = options.log ?? ((line: string) => console.log(line));
  const source = options.source ?? liveSource();
  const staging = new Staging();
  const unlock = staging.lock();
  try {
    return await runSync(source, staging, options, log, t0);
  } finally {
    unlock();
  }
}

async function runSync(source: CatalogSource, staging: Staging, options: SyncOptions, log: (line: string) => void, t0: number): Promise<SyncResult> {
  const previous = options.fresh ? null : staging.resumable(source.id);
  const resumed = Boolean(previous);
  const run = previous ? await prisma.catalogSyncRun.findUnique({ where: { id: previous.runId } }) : null;
  const runId = run?.id ?? (await prisma.catalogSyncRun.create({ data: { source: source.label } })).id;
  if (run) await prisma.catalogSyncRun.update({ where: { id: runId }, data: { status: "running", error: null } });
  const manifest: StagingManifest =
    previous && run
      ? previous
      : { version: 1, runId, source: source.id, label: source.label, startedAt: (options.now ?? new Date()).toISOString(), totalPages: null, itemCount: null, pagesDone: [], fetchComplete: false, chunksWritten: 0, finished: false };
  if (!previous || !run) staging.reset(manifest);
  else log(`[catalog-sync] resuming run ${runId} started ${manifest.startedAt}`);
  const now = new Date(manifest.startedAt);

  try {
    const tFetch = Date.now();
    if (!manifest.fetchComplete) await fetchIntoStaging(source, staging, manifest, log);
    const fetchMs = Date.now() - tFetch;

    const tSelect = Date.now();
    const { lite, products, rejected } = await loadLite(staging);
    if (products === 0) throw new Error("Supplier catalogue is empty — nothing was changed");
    const { candidates, stats } = buildCandidates(lite, { products, rejected }, { margin: env.CATALOG_MARGIN, minMarginAbs: env.CATALOG_MIN_MARGIN_ABS });
    let selection = staging.readSelection();
    if (!selection) {
      const activeRows = await prisma.$queryRaw<{ dedupeKey: string }[]>`
        SELECT k."dedupeKey" FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId" WHERE p."status" = 'ACTIVE'::"ProductStatus"`;
      const knownRows = await prisma.$queryRaw<{ dedupeKey: string }[]>`SELECT "dedupeKey" FROM "KeyItem"`;
      const known = new Set(knownRows.map((r) => r.dedupeKey));
      const picked = selectCatalog(candidates, new Set(activeRows.map((r) => r.dedupeKey)));
      selection = {
        created: picked.filter((c) => !known.has(c.dedupeKey)).length,
        candidates: picked.map((c) => ({ esaId: c.esaId, dedupeKey: c.dedupeKey, title: c.title, displayName: c.displayName, sell: c.sell, alternates: c.alternates, descriptionFrom: c.descriptionFrom })),
      };
      staging.saveSelection(selection);
    }
    const liteById = new Map(lite.map((l) => [l.esaId, l]));
    lite.length = 0;
    const selectMs = Date.now() - tSelect;
    log(`[catalog-sync] ${stats.products.toLocaleString("en-GB")} products · ${stats.eligible.toLocaleString("en-GB")} eligible · ${selection.candidates.length.toLocaleString("en-GB")} selected (${selectMs}ms)`);

    const tWrite = Date.now();
    const chosen = new Map(selection.candidates.map((c) => [c.esaId, c]));
    const fallbackIds = new Set(selection.candidates.map((c) => c.descriptionFrom).filter((id): id is number => id !== null));
    const fallback = new Map<number, string>();
    if (fallbackIds.size) for await (const item of staging.items()) if (fallbackIds.has(item.esaId)) fallback.set(item.esaId, item.description);

    const categories = await ensureCategories();
    const takenRows = await prisma.$queryRaw<{ slug: string }[]>`SELECT "slug" FROM "Product"`;
    const taken = new Set(takenRows.map((r) => r.slug));
    const chunkSize = catalogConfig.sync.chunkSize;
    const totalChunks = Math.ceil(chosen.size / chunkSize);
    const writeStarted = Date.now();
    let onSale = 0;
    let chunkIndex = 0;
    let writtenNow = 0;
    let buffer: WriteRow[] = [];
    const emitted = new Set<number>();
    const flush = async () => {
      if (!buffer.length) return;
      const chunk = buffer;
      buffer = [];
      chunkIndex++;
      if (chunkIndex <= manifest.chunksWritten) return;
      const existing = await existingFor(chunk.map((c) => c.dedupeKey));
      onSale += await prisma.$transaction((tx) => writeChunk(tx, chunk, categories, existing, taken, now), { timeout: 120_000, maxWait: 30_000 });
      manifest.chunksWritten = chunkIndex;
      staging.saveManifest(manifest);
      writtenNow++;
      if (chunkIndex === totalChunks || writtenNow % 10 === 0) log(`[catalog-sync] write ${chunkIndex}/${totalChunks} chunks${eta(writtenNow, totalChunks - (chunkIndex - writtenNow), writeStarted)}`);
    };
    if (manifest.chunksWritten) log(`[catalog-sync] resuming writes after chunk ${manifest.chunksWritten}/${totalChunks}`);
    for await (const item of staging.items()) {
      const pick = chosen.get(item.esaId);
      if (!pick || emitted.has(item.esaId)) continue;
      emitted.add(item.esaId);
      buffer.push({
        ...item,
        title: pick.title,
        displayName: pick.displayName,
        description: item.description || (pick.descriptionFrom !== null ? fallback.get(pick.descriptionFrom) ?? "" : ""),
        sell: pick.sell,
        alternates: pick.alternates,
      });
      if (buffer.length >= chunkSize) await flush();
    }
    await flush();
    const writeMs = Date.now() - tWrite;

    const tFinal = Date.now();
    const selectedIds = selection.candidates.map((c) => productIdFor(c.dedupeKey));
    const archived = await prisma.$executeRaw`
      UPDATE "Product" p SET "status" = 'ARCHIVED'::"ProductStatus", "quantity" = 0, "comparePrice" = NULL, "updatedAt" = now()
      FROM "KeyItem" k
      WHERE k."productId" = p."id"
        AND p."status" <> 'ARCHIVED'::"ProductStatus"
        AND NOT EXISTS (SELECT 1 FROM unnest(${selectedIds}::text[]) AS sel("id") WHERE sel."id" = p."id")`;
    await prisma.$executeRaw`
      UPDATE "SupplyItem" s SET "isAvailable" = false, "qty" = 0, "updatedAt" = now()
      WHERE s."isAvailable" = true
        AND NOT EXISTS (SELECT 1 FROM unnest(${selectedIds}::text[]) AS sel("id") WHERE sel."id" = s."productId")`;
    await prisma.$executeRaw`
      UPDATE "Category" c SET "isActive" = EXISTS (
        SELECT 1 FROM "ProductCategory" pc JOIN "Product" p ON p."id" = pc."productId"
        WHERE pc."categoryId" = c."id" AND p."status" = 'ACTIVE'::"ProductStatus"
      ), "updatedAt" = now()
      WHERE c."id" LIKE 'cat\\_%'`;
    await refreshPlannerStats();
    const finalizeMs = Date.now() - tFinal;

    const byType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    for (const c of selection.candidates) {
      const l = liteById.get(c.esaId);
      if (!l) continue;
      byType[l.productType] = (byType[l.productType] ?? 0) + 1;
      byPlatform[l.platform] = (byPlatform[l.platform] ?? 0) + 1;
    }
    const warnings: string[] = [];
    if (selection.candidates.length < catalogConfig.target.min) {
      warnings.push(`Selected ${selection.candidates.length} products, below the target minimum of ${catalogConfig.target.min} (quota total ${quotaTotal()}). The supplier catalogue has ${stats.eligible} eligible products; all of them within the caps were taken.`);
    }

    const result: SyncResult = {
      runId,
      source: source.label,
      resumed,
      stats,
      selected: selection.candidates.length,
      created: selection.created,
      updated: selection.candidates.length - selection.created,
      archived: Number(archived),
      onSale,
      byType,
      byPlatform,
      warnings,
      timings: { fetchMs, selectMs, writeMs, finalizeMs },
      durationMs: Date.now() - t0,
    };
    await prisma.catalogSyncRun.update({
      where: { id: runId },
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
    manifest.finished = true;
    staging.saveManifest(manifest);
    if (!options.keepStaging) staging.clear();
    log(`[catalog-sync] source=${source.label} products=${stats.products} groups=${stats.groups} eligible=${stats.eligible} selected=${result.selected} created=${result.created} archived=${result.archived} in ${result.durationMs}ms`);
    return result;
  } catch (err) {
    await prisma.catalogSyncRun
      .update({ where: { id: runId }, data: { status: "failed", error: `${err instanceof Error ? err.message : String(err)} (staged data kept; rerun to resume)`, finishedAt: new Date() } })
      .catch(() => {});
    throw err;
  }
}
