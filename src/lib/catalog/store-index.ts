import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GENRES, PLATFORMS, PRODUCT_TYPES, genreDef } from "@/lib/keys/taxonomy";
import { getExchangeRates } from "@/lib/exchange-rates";
import { STORE_POLICY } from "@/config/store-policy";
import { platformInfo } from "./platforms";

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`;

export const BAND_EDGES = [5, 10, 20, 40] as const;

export interface IndexCover {
  slug: string;
  title: string;
  price: number;
  imageUrl: string;
}

export interface IndexPlatform {
  key: string;
  slug: string;
  tone: string;
  short: string;
  count: number;
  minPrice: number | null;
  covers: IndexCover[];
}

export interface IndexType {
  key: string;
  slug: string;
  label: string;
  count: number;
}

export interface IndexBand {
  key: string;
  label: string;
  min: number | null;
  max: number | null;
  baseMin: number | null;
  baseMax: number | null;
  count: number;
}

export interface StoreIndex {
  total: number;
  onSale: number;
  lastSync: string | null;
  platforms: IndexPlatform[];
  types: IndexType[];
  genres: { key: string; label: string; count: number }[];
  bands: Record<string, IndexBand[]>;
}

function bandLabel(min: number | null, max: number | null, currency: string): string {
  const f = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (min === null && max !== null) return `Under ${f(max)}`;
  if (max === null && min !== null) return `${f(min)} and up`;
  return `${f(min ?? 0)}–${f(max ?? 0)}`;
}

export async function getStoreIndex(): Promise<StoreIndex> {
  const [platformRows, typeRows, genreRows, totals, prices, coverRows, lastSync, rates] = await Promise.all([
    prisma.$queryRaw<{ platform: string; count: number; min: number }[]>`
      SELECT k."platform", COUNT(*)::int AS count, MIN(p."price")::float AS min
      FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId" WHERE ${LIVE} GROUP BY k."platform"`,
    prisma.$queryRaw<{ productType: string; count: number }[]>`
      SELECT k."productType", COUNT(*)::int AS count FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId" WHERE ${LIVE} GROUP BY k."productType"`,
    prisma.$queryRaw<{ genre: string; count: number }[]>`
      SELECT g AS genre, COUNT(*)::int AS count FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId", unnest(k."genres") g WHERE ${LIVE} GROUP BY g ORDER BY count DESC`,
    prisma.$queryRaw<{ total: number; sale: number }[]>`
      SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price")::int AS sale FROM "Product" p WHERE ${LIVE}`,
    prisma.$queryRaw<{ price: number }[]>`SELECT p."price"::float AS price FROM "Product" p WHERE ${LIVE}`,
    prisma.$queryRaw<{ platform: string; slug: string; title: string; price: number; url: string; rank: number }[]>`
      SELECT x."platform", x."slug", x."title", x."price", i."url", x.rank FROM (
        SELECT k."platform", p."id", p."slug", k."title", p."price"::float AS price,
          ROW_NUMBER() OVER (PARTITION BY k."platform" ORDER BY COALESCE(oc.n, 0) DESC, k."releaseDate" DESC NULLS LAST, p."createdAt" DESC) AS rank
        FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
        LEFT JOIN (SELECT "productId", COUNT(*)::int AS n FROM "OrderItem" GROUP BY "productId") oc ON oc."productId" = p."id"
        WHERE ${LIVE} AND k."productType" IN ('game', 'dlc') AND k."edition" IS NULL
      ) x
      JOIN LATERAL (SELECT "url" FROM "ProductImage" WHERE "productId" = x."id" ORDER BY "sortOrder" ASC LIMIT 1) i ON true
      WHERE x.rank <= 3`,
    prisma.catalogSyncRun.findFirst({ where: { status: "ok", finishedAt: { not: null } }, orderBy: { finishedAt: "desc" }, select: { finishedAt: true } }).catch(() => null),
    getExchangeRates(),
  ]);

  const covers = new Map<string, IndexCover[]>();
  for (const r of coverRows) covers.set(r.platform, [...(covers.get(r.platform) ?? []), { slug: r.slug, title: r.title, price: r.price, imageUrl: r.url }]);

  const platforms = platformRows
    .filter((r) => r.count > 0 && PLATFORMS.some((p) => p.key === r.platform) && r.platform !== "other")
    .map((r) => {
      const info = platformInfo(r.platform);
      return { key: info.key, slug: info.slug, tone: info.tone, short: info.short, count: r.count, minPrice: r.min, covers: covers.get(r.platform) ?? [] };
    })
    .sort((a, b) => b.count - a.count);

  const typeCounts = new Map(typeRows.map((r) => [r.productType, r.count]));
  const types = PRODUCT_TYPES.filter((t) => (typeCounts.get(t.key) ?? 0) > 0).map((t) => ({ key: t.key, slug: t.slug, label: t.key === "dlc" ? "DLC" : t.label, count: typeCounts.get(t.key) ?? 0 }));

  const genres = genreRows
    .filter((g) => genreDef(g.genre))
    .map((g) => ({ key: g.genre, label: genreDef(g.genre)?.label ?? g.genre, count: g.count }))
    .sort((a, b) => b.count - a.count || GENRES.findIndex((x) => x.key === a.key) - GENRES.findIndex((x) => x.key === b.key));

  const bands: Record<string, IndexBand[]> = {};
  for (const currency of STORE_POLICY.supportedCurrencies) {
    const rate = rates[currency as keyof typeof rates] ?? 1;
    const edges: (number | null)[] = [null, ...BAND_EDGES, null];
    bands[currency] = edges.slice(0, -1).map((min, i) => {
      const max = edges[i + 1];
      const count = prices.filter((p) => {
        const v = p.price * rate;
        return (min === null || v >= min) && (max === null || v < max);
      }).length;
      return {
        key: `${min ?? 0}-${max ?? "up"}`,
        label: bandLabel(min, max, currency),
        min,
        max,
        baseMin: min === null ? null : Math.round((min / rate) * 100) / 100,
        baseMax: max === null ? null : Math.round((max / rate) * 100 - 1) / 100,
        count,
      };
    });
  }

  return {
    total: totals[0]?.total ?? 0,
    onSale: totals[0]?.sale ?? 0,
    lastSync: lastSync?.finishedAt ? lastSync.finishedAt.toISOString() : null,
    platforms,
    types,
    genres,
    bands,
  };
}
