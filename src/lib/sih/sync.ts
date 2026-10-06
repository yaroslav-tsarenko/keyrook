import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { catalogConfig, quotaTotal } from "@/config/catalog";
import { slugify } from "@/lib/utils/slugify";
import { WEAPON_TYPES, exteriorDef, floatRangeLabel, rarityDef, skinTitle, weaponSlug, weaponTypeDef } from "@/lib/skins/cs2";
import { getItems } from "./client";
import { buildCandidates, selectCatalog, stableHash, type Candidate, type CandidateStats } from "./catalog-select";
import { flattenCatalog, type SihGetItems } from "./types";

export type CatalogSource = () => Promise<SihGetItems>;

export interface SyncResult {
  runId: string;
  source: string;
  stats: CandidateStats;
  selected: number;
  created: number;
  updated: number;
  archived: number;
  byType: Record<string, number>;
  warnings: string[];
  durationMs: number;
}

export function productIdFor(marketHashName: string): string {
  return `skn_${stableHash(marketHashName).slice(0, 24)}`;
}

export function skuFor(marketHashName: string): string {
  return `PS-${stableHash(marketHashName).slice(0, 10).toUpperCase()}`;
}

function describe(c: Candidate): string {
  const ext = exteriorDef(c.exterior);
  const range = floatRangeLabel(c.floatMin, c.floatMax);
  const type = weaponTypeDef(c.weaponType);
  const rarity = rarityDef(c.rarity);
  const parts = [
    `${c.isSouvenir ? "Souvenir " : ""}${c.isStatTrak ? "StatTrak™ " : ""}${skinTitle(c)}`,
    ext ? `${ext.label}${range ? `, float ${range}` : ""}` : "Vanilla finish, no wear rating",
  ];
  const lines = [`${parts.join(" — ")}.`, `${rarity?.label ?? ""} ${type?.singular.toLowerCase() ?? "item"} for Counter-Strike 2.`.trim()];
  if (c.isStatTrak) lines.push("StatTrak™ counts confirmed kills made with this item.");
  if (c.isSouvenir) lines.push("Souvenir items carry tournament stickers that cannot be removed.");
  if (c.collection) lines.push(`Collection: ${c.collection}.`);
  lines.push("Delivered to your Steam account by trade offer after your payment is confirmed.");
  return lines.join(" ");
}

async function ensureCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [typeIndex, type] of WEAPON_TYPES.entries()) {
    const root = await prisma.category.upsert({
      where: { slug: type.key },
      create: { id: `cat_${type.key}`, name: type.label, slug: type.key, sortOrder: typeIndex, isActive: true },
      update: { name: type.label, parentId: null, sortOrder: typeIndex },
      select: { id: true },
    });
    ids.set(type.key, root.id);
    for (const [weaponIndex, weapon] of type.weapons.entries()) {
      const slug = weaponSlug(weapon);
      const child = await prisma.category.upsert({
        where: { slug },
        create: { id: `cat_${slug}`, name: weapon, slug, parentId: root.id, sortOrder: weaponIndex, isActive: true },
        update: { name: weapon, parentId: root.id, sortOrder: weaponIndex },
        select: { id: true },
      });
      ids.set(`${type.key}/${weapon}`, child.id);
    }
  }
  return ids;
}

async function writeChunk(chunk: Candidate[], categories: Map<string, string>, slugs: Map<string, string>): Promise<void> {
  const now = new Date();
  const products = chunk.map((c) => {
    const id = productIdFor(c.marketHashName);
    return Prisma.sql`(${id}, ${c.marketHashName}, ${slugs.get(c.marketHashName)!}, ${skuFor(c.marketHashName)}, ${describe(c)}, ${c.sell}, ${c.cost}, true, 1, 0, 'ACTIVE'::"ProductStatus", false, 'new', '5032', ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "Product" ("id", "name", "slug", "sku", "description", "price", "costPrice", "trackInventory", "quantity", "lowStockAlert", "status", "isFeatured", "condition", "googleCategory", "createdAt", "updatedAt")
    VALUES ${Prisma.join(products)}
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "price" = EXCLUDED."price",
      "costPrice" = EXCLUDED."costPrice",
      "quantity" = 1,
      "status" = 'ACTIVE'::"ProductStatus",
      "updatedAt" = EXCLUDED."updatedAt"`;

  const images = chunk.map((c) => {
    const id = productIdFor(c.marketHashName);
    return Prisma.sql`(${`img_${id.slice(4)}`}, ${c.imageUrl}, ${c.marketHashName}, 0, ${id})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "ProductImage" ("id", "url", "alt", "sortOrder", "productId")
    VALUES ${Prisma.join(images)}
    ON CONFLICT ("id") DO UPDATE SET "url" = EXCLUDED."url", "alt" = EXCLUDED."alt"`;

  const links = chunk.flatMap((c) => {
    const id = productIdFor(c.marketHashName);
    return [
      Prisma.sql`(${id}, ${categories.get(c.weaponType)!})`,
      Prisma.sql`(${id}, ${categories.get(`${c.weaponType}/${c.weapon}`)!})`,
    ];
  });
  await prisma.$executeRaw`
    INSERT INTO "ProductCategory" ("productId", "categoryId")
    VALUES ${Prisma.join(links)}
    ON CONFLICT DO NOTHING`;

  const skins = chunk.map((c) => {
    const id = productIdFor(c.marketHashName);
    return Prisma.sql`(${`sk_${id.slice(4)}`}, ${id}, ${c.marketHashName}, ${c.weaponType}, ${c.weapon}, ${c.skinName}, ${c.rarity}, ${c.rarityColor}, ${c.exterior}, ${c.floatMin}, ${c.floatMax}, ${c.isStatTrak}, ${c.isSouvenir}, ${c.collection}, ${c.phase}, ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "Skin" ("id", "productId", "marketHashName", "weaponType", "weapon", "skinName", "rarity", "rarityColor", "exterior", "floatMin", "floatMax", "isStatTrak", "isSouvenir", "collection", "phase", "createdAt", "updatedAt")
    VALUES ${Prisma.join(skins)}
    ON CONFLICT ("marketHashName") DO UPDATE SET
      "productId" = EXCLUDED."productId",
      "weaponType" = EXCLUDED."weaponType",
      "weapon" = EXCLUDED."weapon",
      "skinName" = EXCLUDED."skinName",
      "rarity" = EXCLUDED."rarity",
      "rarityColor" = EXCLUDED."rarityColor",
      "exterior" = EXCLUDED."exterior",
      "floatMin" = EXCLUDED."floatMin",
      "floatMax" = EXCLUDED."floatMax",
      "isStatTrak" = EXCLUDED."isStatTrak",
      "isSouvenir" = EXCLUDED."isSouvenir",
      "collection" = EXCLUDED."collection",
      "phase" = EXCLUDED."phase",
      "updatedAt" = EXCLUDED."updatedAt"`;

  const items = chunk.map((c) => {
    const id = productIdFor(c.marketHashName);
    return Prisma.sql`(${c.marketHashName}, ${id}, ${env.SIH_APP_ID}, ${c.cost}, ${c.sell}, ${c.steamPrice}, ${c.count}, ${c.offers}, ${c.phase}, ${c.offer.market}, ${c.imageHash}, ${c.rarityColor}, ${JSON.stringify(c.offer)}::jsonb, true, ${now}, ${now}, ${now})`;
  });
  await prisma.$executeRaw`
    INSERT INTO "SihItem" ("marketHashName", "productId", "appId", "costPrice", "sellPrice", "steamPrice", "count", "offers", "phase", "market", "imageHash", "rarityColor", "offer", "isAvailable", "syncedAt", "createdAt", "updatedAt")
    VALUES ${Prisma.join(items)}
    ON CONFLICT ("marketHashName") DO UPDATE SET
      "productId" = EXCLUDED."productId",
      "appId" = EXCLUDED."appId",
      "costPrice" = EXCLUDED."costPrice",
      "sellPrice" = EXCLUDED."sellPrice",
      "steamPrice" = EXCLUDED."steamPrice",
      "count" = EXCLUDED."count",
      "offers" = EXCLUDED."offers",
      "phase" = EXCLUDED."phase",
      "market" = EXCLUDED."market",
      "imageHash" = EXCLUDED."imageHash",
      "rarityColor" = EXCLUDED."rarityColor",
      "offer" = EXCLUDED."offer",
      "isAvailable" = true,
      "syncedAt" = EXCLUDED."syncedAt",
      "updatedAt" = EXCLUDED."updatedAt"`;
}

function assignSlugs(selected: Candidate[], taken: Map<string, string>): Map<string, string> {
  const slugs = new Map<string, string>();
  const used = new Set<string>(taken.values());
  for (const c of selected) {
    const existing = taken.get(c.marketHashName);
    if (existing) {
      slugs.set(c.marketHashName, existing);
      continue;
    }
    let slug = slugify(c.marketHashName.replace(/[™★]/g, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")) || productIdFor(c.marketHashName);
    if (used.has(slug)) slug = `${slug}-${stableHash(c.marketHashName).slice(0, 6)}`;
    used.add(slug);
    slugs.set(c.marketHashName, slug);
  }
  return slugs;
}

export async function syncCatalog(options: { source?: CatalogSource; label?: string } = {}): Promise<SyncResult> {
  const t0 = Date.now();
  const sourceLabel = options.label ?? "live";
  const run = await prisma.catalogSyncRun.create({ data: { source: sourceLabel } });

  try {
    const startedAt = new Date();
    const response = await (options.source ?? (() => getItems()))();
    const offers = flattenCatalog(response.items);
    const { candidates, stats } = buildCandidates(offers, { margin: env.SIH_MARGIN, minMarginAbs: env.SIH_MIN_MARGIN_ABS });

    const existingRows = await prisma.skin.findMany({
      select: { marketHashName: true, product: { select: { slug: true, status: true } } },
    });
    const existingActive = new Set(existingRows.filter((r) => r.product.status === "ACTIVE").map((r) => r.marketHashName));
    const existingSlugs = new Map(existingRows.map((r) => [r.marketHashName, r.product.slug]));

    const selected = selectCatalog(candidates, existingActive);
    const warnings: string[] = [];
    if (offers.length === 0) throw new Error("Supplier catalogue is empty — nothing was changed");
    if (selected.length < catalogConfig.target.min) {
      warnings.push(`Selected ${selected.length} products, below the target minimum of ${catalogConfig.target.min} (quota total ${quotaTotal()}).`);
    }

    const categories = await ensureCategories();
    const slugs = assignSlugs(selected, existingSlugs);
    const chunkSize = catalogConfig.sync.chunkSize;
    for (let i = 0; i < selected.length; i += chunkSize) {
      await writeChunk(selected.slice(i, i + chunkSize), categories, slugs);
    }

    const selectedIds = selected.map((c) => productIdFor(c.marketHashName));
    const created = selected.filter((c) => !existingSlugs.has(c.marketHashName)).length;
    const archived = await prisma.$executeRaw`
      UPDATE "Product" SET "status" = 'ARCHIVED'::"ProductStatus", "quantity" = 0, "updatedAt" = now()
      WHERE "id" IN (SELECT "productId" FROM "Skin")
        AND "status" <> 'ARCHIVED'::"ProductStatus"
        AND NOT ("id" = ANY(${selectedIds}))`;
    await prisma.$executeRaw`
      UPDATE "SihItem" SET "isAvailable" = false, "count" = 0, "updatedAt" = now()
      WHERE "syncedAt" < ${startedAt} AND "isAvailable" = true`;
    await prisma.$executeRaw`
      UPDATE "Category" c SET "isActive" = EXISTS (
        SELECT 1 FROM "ProductCategory" pc JOIN "Product" p ON p."id" = pc."productId"
        WHERE pc."categoryId" = c."id" AND p."status" = 'ACTIVE'::"ProductStatus"
      ), "updatedAt" = now()
      WHERE c."id" IN (SELECT DISTINCT pc2."categoryId" FROM "ProductCategory" pc2 JOIN "Skin" s ON s."productId" = pc2."productId")`;

    const byType: Record<string, number> = {};
    for (const c of selected) byType[c.weaponType] = (byType[c.weaponType] ?? 0) + 1;

    const result: SyncResult = {
      runId: run.id,
      source: sourceLabel,
      stats,
      selected: selected.length,
      created,
      updated: selected.length - created,
      archived: Number(archived),
      byType,
      warnings,
      durationMs: Date.now() - t0,
    };
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: warnings.length ? "warning" : "ok",
        fetched: stats.offers,
        eligible: stats.eligible,
        selected: result.selected,
        created: result.created,
        updated: result.updated,
        archived: result.archived,
        error: warnings.join(" ") || null,
        finishedAt: new Date(),
      },
    });
    console.log(
      `[catalog-sync] source=${sourceLabel} offers=${stats.offers} names=${stats.names} eligible=${stats.eligible} ` +
        `selected=${result.selected} created=${result.created} archived=${result.archived} in ${result.durationMs}ms`,
    );
    return result;
  } catch (err) {
    await prisma.catalogSyncRun
      .update({ where: { id: run.id }, data: { status: "failed", error: err instanceof Error ? err.message : String(err), finishedAt: new Date() } })
      .catch(() => {});
    throw err;
  }
}
