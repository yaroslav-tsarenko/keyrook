import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { memoize } from "@/lib/utils/memo";

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`;

export interface StockCell {
  type: string;
  platform: string;
  count: number;
  minPrice: number;
}

const stockCells = memoize(
  2 * 60_000,
  () =>
    prisma.$queryRaw<StockCell[]>`
      SELECT k."productType" AS "type", k."platform", COUNT(*)::int AS "count", MIN(p."price")::float AS "minPrice"
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE}
      GROUP BY 1, 2`,
  { staleMs: 10 * 60_000 },
);

const genreCells = memoize(
  2 * 60_000,
  () =>
    prisma.$queryRaw<{ genre: string; platform: string; count: number }[]>`
      SELECT g AS "genre", k."platform", COUNT(*)::int AS "count"
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id", unnest(k."genres") g
      WHERE ${LIVE}
      GROUP BY 1, 2`,
  { staleMs: 10 * 60_000 },
);

export async function platformTypeCounts(platform: string): Promise<Map<string, number>> {
  return new Map((await stockCells()).filter((c) => c.platform === platform).map((c) => [c.type, c.count]));
}

export async function platformMinPrice(platform: string): Promise<number | null> {
  const prices = (await stockCells()).filter((c) => c.platform === platform).map((c) => c.minPrice);
  return prices.length ? Math.min(...prices) : null;
}

export async function stockedPlatformCounts(): Promise<{ platform: string; count: number }[]> {
  const totals = new Map<string, number>();
  for (const c of await stockCells()) totals.set(c.platform, (totals.get(c.platform) ?? 0) + c.count);
  return [...totals.entries()].map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count);
}

export async function genrePlatformCounts(genre: string): Promise<{ platform: string; count: number }[]> {
  return (await genreCells())
    .filter((c) => c.genre === genre)
    .map((c) => ({ platform: c.platform, count: c.count }))
    .sort((a, b) => b.count - a.count);
}
