import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, PRODUCT_TYPES } from "@/lib/keys/taxonomy";
import { loadKeyProducts } from "@/components/catalog/catalog-query";
import { MERCH, PRICE_BANDS } from "@/config/merchandising";
import type { HomeData } from "./types";

interface IdRow {
  id: string;
}

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`;
const HAS_COVER = Prisma.sql`EXISTS (SELECT 1 FROM "ProductImage" i WHERE i."productId" = p."id")`;

function notIn(ids: Set<string>) {
  return ids.size ? Prisma.sql`AND p."id" NOT IN (${Prisma.join([...ids])})` : Prisma.empty;
}

export async function getHomeData(): Promise<HomeData> {
  const claimed = new Set<string>();
  const claim = (ids: string[]) => ids.forEach((id) => claimed.add(id));

  const [typeRows, platformRows, totals] = await Promise.all([
    prisma.$queryRaw<{ productType: string; count: number; min: number }[]>`
      SELECT k."productType", COUNT(*)::int AS count, MIN(p."price")::float AS min
      FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId"
      WHERE ${LIVE} GROUP BY k."productType"`,
    prisma.$queryRaw<{ platform: string; count: number; min: number }[]>`
      SELECT k."platform", COUNT(*)::int AS count, MIN(p."price")::float AS min
      FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId"
      WHERE ${LIVE} GROUP BY k."platform"`,
    prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "Product" p WHERE ${LIVE}`,
  ]);

  const featured = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p WHERE ${LIVE} AND ${HAS_COVER} AND p."isFeatured" = true
    ORDER BY p."updatedAt" DESC LIMIT 1`;
  const heroRow = featured[0]
    ? featured
    : await prisma.$queryRaw<IdRow[]>`
        SELECT p."id" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
        WHERE ${LIVE} AND ${HAS_COVER} AND k."productType" = 'game' AND k."region" = 'global' AND k."releaseDate" IS NOT NULL AND k."edition" IS NULL
        ORDER BY k."releaseDate" DESC, p."price" DESC LIMIT 1`;
  claim(heroRow.map((r) => r.id));

  const typeStats = new Map(typeRows.map((r) => [r.productType, r]));
  const types = PRODUCT_TYPES.map((t) => ({
    key: t.key,
    slug: t.slug,
    name: t.label,
    href: `/catalog/${t.slug}`,
    count: typeStats.get(t.key)?.count ?? 0,
    minPrice: typeStats.get(t.key)?.min ?? null,
    lead: t.lead,
  })).filter((t) => t.count > 0);
  const platformStats = new Map(platformRows.map((r) => [r.platform, r]));
  const platforms = PLATFORMS.filter((p) => p.key !== "other")
    .map((p) => ({ key: p.key, slug: p.slug, name: p.label, href: `/platform/${p.slug}`, count: platformStats.get(p.key)?.count ?? 0, minPrice: platformStats.get(p.key)?.min ?? null }))
    .filter((p) => p.count > 0);

  const releases = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (lower(k."title")) p."id", k."releaseDate"
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE} AND ${HAS_COVER} AND k."productType" = 'game' AND k."releaseDate" IS NOT NULL AND k."releaseDate" <= now() ${notIn(claimed)}
      ORDER BY lower(k."title"), p."price" ASC
    ) x ORDER BY x."releaseDate" DESC LIMIT ${MERCH.releases}`;
  claim(releases.map((r) => r.id));

  const prepaid = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (k."productType", k."platform") p."id", k."productType"
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE} AND ${HAS_COVER} AND k."productType" IN ('subscription', 'gift-card') ${notIn(claimed)}
      ORDER BY k."productType", k."platform", p."price" ASC
    ) x ORDER BY x."productType" DESC LIMIT ${MERCH.prepaid}`;
  claim(prepaid.map((r) => r.id));

  const bands = [];
  for (const band of PRICE_BANDS) {
    const lower = band.min !== null ? Prisma.sql`AND p."price" >= ${band.min}` : Prisma.empty;
    const upper = band.max !== null ? Prisma.sql`AND p."price" < ${band.max}` : Prisma.empty;
    const rows = await prisma.$queryRaw<{ id: string; price: number }[]>`
      SELECT p."id", p."price"::float AS price
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE} AND ${HAS_COVER} AND k."productType" IN ('game', 'dlc') ${lower} ${upper} ${notIn(claimed)}
      ORDER BY p."price" ASC`;
    if (rows.length < MERCH.bandMinimum) continue;
    const step = rows.length / Math.min(MERCH.bandItems, rows.length);
    const picks = Array.from({ length: Math.min(MERCH.bandItems, rows.length) }, (_, i) => rows[Math.min(rows.length - 1, Math.floor(i * step + step / 2))]);
    const unique = [...new Map(picks.map((r) => [r.id, r])).values()];
    const ordered = [...unique].sort((a, b) => b.price - a.price);
    claim(ordered.map((r) => r.id));
    bands.push({ key: band.key, min: band.min, max: band.max, total: rows.length, products: await loadKeyProducts(ordered.map((r) => r.id)) });
  }

  const newest = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p
    WHERE ${LIVE} AND ${HAS_COVER} ${notIn(claimed)}
    ORDER BY p."createdAt" DESC, p."id" ASC LIMIT ${MERCH.newest}`;
  claim(newest.map((r) => r.id));

  const drops = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p
    WHERE ${LIVE} AND ${HAS_COVER} AND p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price" ${notIn(claimed)}
    ORDER BY (p."comparePrice" - p."price") / p."comparePrice" DESC LIMIT 4`;

  const [hero, releaseProducts, prepaidProducts, newestProducts, dropProducts] = await Promise.all([
    loadKeyProducts(heroRow.map((r) => r.id)),
    loadKeyProducts(releases.map((r) => r.id)),
    loadKeyProducts(prepaid.map((r) => r.id)),
    loadKeyProducts(newest.map((r) => r.id)),
    loadKeyProducts(drops.map((r) => r.id)),
  ]);

  return {
    totalProducts: totals[0]?.count ?? 0,
    hero: hero[0] ?? null,
    types,
    platforms,
    bands,
    releases: releaseProducts,
    prepaid: prepaidProducts,
    newest: newestProducts,
    drops: dropProducts,
  };
}
