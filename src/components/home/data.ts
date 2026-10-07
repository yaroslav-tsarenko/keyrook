import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { memoize } from "@/lib/utils/memo";
import { GENRES, PLATFORMS, PRODUCT_TYPES } from "@/lib/keys/taxonomy";
import { platformInfo } from "@/lib/catalog/platforms";
import { giftCardGroups, subscriptionTimetable, type GiftCardGroup, type Timetable, type TimetableRow } from "@/lib/catalog/prepaid";
import { loadKeyProducts } from "@/components/catalog/catalog-query";
import { MERCH, PRICE_BAND_EDGES } from "@/config/merchandising";
import { STORE_POLICY } from "@/config/store-policy";
import { getExchangeRates } from "@/lib/exchange-rates";
import type { CatalogProduct } from "@/components/product/product-face";
import type { CoverRef, HomeBand, HomeData, HomeGenre, HomePlatform } from "./types";

const ORDERS = Prisma.sql`LEFT JOIN (SELECT "productId", SUM("quantity")::int AS n FROM "OrderItem" GROUP BY "productId") o ON o."productId" = p."id"`;
const COVER = Prisma.sql`JOIN "ProductImage" c ON c."productId" = p."id" AND c."sortOrder" = 0`;
const HAS_SCREENSHOT = Prisma.sql`EXISTS (SELECT 1 FROM "ProductImage" s WHERE s."productId" = p."id" AND s."sortOrder" = 1)`;
const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0 AND (k."releaseDate" IS NULL OR k."releaseDate" <= now())`;
const FROM = Prisma.sql`FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id" ${ORDERS} ${COVER} WHERE ${LIVE}`;


function notIn(ids: Set<string>) {
  return ids.size ? Prisma.sql`AND p."id" NOT IN (${Prisma.join([...ids])})` : Prisma.empty;
}


function bandEdges(rate: number): { min: number | null; max: number | null; baseMin: number | null; baseMax: number | null }[] {
  const edges = [null, ...PRICE_BAND_EDGES, null] as (number | null)[];
  return edges.slice(0, -1).map((min, i) => {
    const max = edges[i + 1] ?? null;
    return { min, max, baseMin: min === null ? null : Math.round((min / rate) * 100) / 100, baseMax: max === null ? null : Math.round((max / rate) * 100) / 100 };
  });
}

function bandKey(min: number | null, max: number | null) {
  return min === null ? `under-${max}` : max === null ? `${min}-up` : `${min}-${max}`;
}

interface PoolRow {
  id: string;
  slug: string;
  title: string;
  type: string;
  platform: string;
  genres: string[];
  price: number;
}

function pickDistinct(pool: PoolRow[], accept: (r: PoolRow) => boolean, claimed: Set<string>, limit: number): PoolRow[] {
  const titles = new Set<string>();
  const out: PoolRow[] = [];
  for (const r of pool) {
    if (out.length >= limit) break;
    if (claimed.has(r.id) || !accept(r)) continue;
    const title = r.title.toLowerCase();
    if (titles.has(title)) continue;
    titles.add(title);
    out.push(r);
  }
  return out;
}

function pickFirst(pool: PoolRow[], accept: (r: PoolRow) => boolean, claimed: Set<string>, limit: number): PoolRow[] {
  const out: PoolRow[] = [];
  for (const r of pool) {
    if (out.length >= limit) break;
    if (!claimed.has(r.id) && accept(r)) out.push(r);
  }
  return out;
}

const REGION_RANK = ["global", "europe", "uk", "us", "north-america"];

function homeTimetable(table: Timetable, limit: number): Timetable {
  const best = new Map<string, TimetableRow>();
  for (const row of table.rows) {
    const id = row.service.toLowerCase();
    const prev = best.get(id);
    const score = (r: TimetableRow) => Object.keys(r.cells).length * 10 - Math.max(0, REGION_RANK.indexOf(r.region));
    if (!prev || score(row) > score(prev)) best.set(id, row);
  }
  const byPlatform = new Map<string, TimetableRow[]>();
  for (const row of best.values()) byPlatform.set(row.platform, [...(byPlatform.get(row.platform) ?? []), row]);
  const queues = [...byPlatform.values()].map((rows) => rows.sort((a, b) => Object.keys(b.cells).length - Object.keys(a.cells).length || a.service.localeCompare(b.service, "en-GB")));
  const picked: TimetableRow[] = [];
  while (queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) picked.push(next);
    }
  }
  const order = (p: string) => PLATFORMS.findIndex((x) => x.key === p);
  const uses = new Map<string, number>();
  for (const r of picked.slice(0, limit)) for (const k of Object.keys(r.cells)) uses.set(k, (uses.get(k) ?? 0) + 1);
  const columns = table.columns.filter((c) => (uses.get(c.key) ?? 0) >= 2);
  const keep = new Set(columns.map((c) => c.key));
  const rows = picked
    .map((r) => ({ ...r, cells: Object.fromEntries(Object.entries(r.cells).filter(([k]) => keep.has(k))) }))
    .filter((r) => Object.keys(r.cells).length > 0)
    .slice(0, limit)
    .sort((a, b) => order(a.platform) - order(b.platform) || a.service.localeCompare(b.service, "en-GB"));
  return { columns, rows };
}

async function computeHomeData(): Promise<HomeData> {
  const claimed = new Set<string>();
  const claim = (ids: string[]) => ids.forEach((id) => claimed.add(id));

  const [pool, totals, typeRows, platformRows, syncRows, rates, groups, timetable] = await Promise.all([
    prisma.$queryRaw<PoolRow[]>`
      SELECT x."id", x."slug", x."title", x."type", x."platform", x."genres", x."price" FROM (
        SELECT p."id", p."slug", k."title", k."productType" AS "type", k."platform", k."genres", p."price"::float AS "price", COALESCE(o.n, 0) AS "n", k."releaseDate" AS "rd",
          ROW_NUMBER() OVER (PARTITION BY k."platform" ORDER BY COALESCE(o.n, 0) DESC, k."releaseDate" DESC NULLS LAST, p."id" ASC) AS "rank"
        FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id" ${ORDERS}
        WHERE ${LIVE} AND k."productType" IN ('game', 'dlc') AND EXISTS (SELECT 1 FROM "ProductImage" c WHERE c."productId" = p."id" AND c."sortOrder" = 0)
      ) x
      WHERE x."rank" <= ${MERCH.homePoolPerPlatform}
      ORDER BY x."n" DESC, x."rd" DESC NULLS LAST, x."id" ASC`,
    prisma.$queryRaw<{ live: number; sale: number }[]>`
      SELECT COUNT(*)::int AS live,
        COUNT(*) FILTER (WHERE p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price")::int AS sale
      FROM "Product" p WHERE p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`,
    prisma.$queryRaw<{ productType: string; count: number }[]>`
      SELECT k."productType", COUNT(*)::int AS count FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId"
      WHERE p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0 GROUP BY k."productType"`,
    prisma.$queryRaw<{ platform: string; count: number; min: number }[]>`
      SELECT k."platform", COUNT(*)::int AS count, MIN(p."price")::float AS min FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId"
      WHERE p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0 GROUP BY k."platform"`,
    prisma.$queryRaw<{ finishedAt: Date }[]>`SELECT "finishedAt" FROM "CatalogSyncRun" WHERE "status" = 'ok' AND "finishedAt" IS NOT NULL ORDER BY "finishedAt" DESC LIMIT 1`,
    getExchangeRates(),
    giftCardGroups(),
    subscriptionTimetable(500),
  ]);

  const typeCount = new Map(typeRows.map((r) => [r.productType, r.count]));
  const types = PRODUCT_TYPES.map((t) => ({ key: t.key, name: t.label, href: `/catalog/${t.slug}`, count: typeCount.get(t.key) ?? 0 })).filter((t) => t.count > 0);

  const door = pickDistinct(pool, (r) => r.type === "game", claimed, MERCH.doorCovers);
  claim(door.map((r) => r.id));

  const stats = new Map(platformRows.map((r) => [r.platform, r]));
  const stocked = PLATFORMS.filter((p) => p.key !== "other" && (stats.get(p.key)?.count ?? 0) > 0).sort((a, b) => (stats.get(b.key)?.count ?? 0) - (stats.get(a.key)?.count ?? 0));
  const lockerRows = stocked.flatMap((p) => pickFirst(pool, (r) => r.platform === p.key, claimed, MERCH.lockerCovers));
  claim(lockerRows.map((r) => r.id));
  const DEAL = Prisma.sql`p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price"`;
  const featureRow = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p."id" ${FROM} AND ${DEAL} AND ${HAS_SCREENSHOT} ${notIn(claimed)}
    ORDER BY (p."comparePrice" - p."price") / p."comparePrice" DESC, p."id" LIMIT 1`;
  claim(featureRow.map((r) => r.id));
  const railRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (lower(k."title")) p."id", (p."comparePrice" - p."price") / p."comparePrice" AS cut
      ${FROM} AND ${DEAL} ${notIn(claimed)}
      ORDER BY lower(k."title"), (p."comparePrice" - p."price") / p."comparePrice" DESC
    ) x ORDER BY x.cut DESC, x.id LIMIT ${MERCH.dealRail}`;
  claim(railRows.map((r) => r.id));

  const releaseRows = await prisma.$queryRaw<{ id: string; releaseDate: Date }[]>`
    SELECT id, rd AS "releaseDate" FROM (
      SELECT DISTINCT ON (lower(k."title")) p."id", k."releaseDate" AS rd
      ${FROM} AND k."productType" = 'game' AND k."releaseDate" IS NOT NULL AND k."releaseDate" > now() - make_interval(days => ${MERCH.releaseWindowDays}) ${notIn(claimed)}
      ORDER BY lower(k."title"), p."price" ASC
    ) x ORDER BY x.rd DESC, x.id LIMIT ${MERCH.releases}`;
  const weekRows = await prisma.$queryRaw<{ week: number; count: number }[]>`
    SELECT FLOOR(EXTRACT(EPOCH FROM (now() - k."releaseDate")) / 604800)::int AS week, COUNT(DISTINCT lower(k."title"))::int AS count
    FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId"
    WHERE ${LIVE} AND k."productType" = 'game' AND k."releaseDate" IS NOT NULL AND k."releaseDate" > now() - make_interval(days => ${MERCH.releaseWindowDays})
    GROUP BY 1`;
  const showReleases = releaseRows.length >= MERCH.releaseMinimum;
  if (showReleases) claim(releaseRows.map((r) => r.id));
  const now = Date.now();
  const weeksBack = Math.round(MERCH.releaseWindowDays / 7);
  const weekCount = new Map(weekRows.map((r) => [r.week, r.count]));
  const weeks = Array.from({ length: weeksBack }, (_, i) => {
    const back = weeksBack - 1 - i;
    return { start: new Date(now - (back + 1) * 604800000).toISOString(), count: weekCount.get(back) ?? 0 };
  });

  const genreRows = await prisma.$queryRaw<{ genre: string; count: number }[]>`
    SELECT g AS genre, COUNT(*)::int AS count FROM "KeyItem" k JOIN "Product" p ON p."id" = k."productId", unnest(k."genres") g
    WHERE p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0 GROUP BY g ORDER BY 2 DESC`;
  const known = new Map(GENRES.map((g) => [g.key, g.label]));
  const topGenres = genreRows.filter((r) => known.has(r.genre)).slice(0, MERCH.genres);
  const genrePicks = topGenres.map((g) => {
    const rows = pickFirst(pool, (r) => r.type === "game" && r.genres.includes(g.genre), claimed, MERCH.genrePeek);
    claim(rows.map((r) => r.id));
    return rows;
  });

  const bands: Record<string, HomeBand[]> = {};
  const bandIds = new Set<string>();
  const currencies = STORE_POLICY.supportedCurrencies;
  const perCurrency = await Promise.all(
    currencies.map(async (currency) => {
      const rate = currency === STORE_POLICY.currency ? 1 : rates[currency];
      const edges = bandEdges(rate);
      const caseSql = Prisma.join(
        edges.map((e, i) => {
          const lo = e.baseMin === null ? Prisma.sql`TRUE` : Prisma.sql`p."price" >= ${e.baseMin}`;
          const hi = e.baseMax === null ? Prisma.sql`TRUE` : Prisma.sql`p."price" < ${e.baseMax}`;
          return Prisma.sql`WHEN ${lo} AND ${hi} THEN ${i}`;
        }),
        " ",
      );
      const countRows = await prisma.$queryRaw<{ band: number; count: number }[]>`
        SELECT CASE ${caseSql} END AS band, COUNT(*)::int AS count FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id" WHERE ${LIVE} GROUP BY 1`;
      const bandOf = (price: number) => edges.findIndex((e) => (e.baseMin === null || price >= e.baseMin) && (e.baseMax === null || price < e.baseMax));
      const ranked = edges.map(() => [] as { id: string; prn: number; at: number }[]);
      const perPlatform = new Map<string, number>();
      pool.forEach((r, at) => {
        if (claimed.has(r.id)) return;
        const band = bandOf(r.price);
        if (band < 0) return;
        const key = `${band}|${r.platform}`;
        const prn = (perPlatform.get(key) ?? 0) + 1;
        perPlatform.set(key, prn);
        if (prn <= MERCH.bandItems) ranked[band].push({ id: r.id, prn, at });
      });
      const counts = new Map(countRows.map((r) => [Number(r.band), r.count]));
      const list = edges.map((e, i) => ({
        key: bandKey(e.min, e.max),
        ...e,
        total: counts.get(i) ?? 0,
        ids: ranked[i]
          .sort((x, y) => x.prn - y.prn || x.at - y.at)
          .slice(0, MERCH.bandItems)
          .map((x) => x.id),
      }));
      return [currency, list] as const;
    }),
  );
  for (const [currency, list] of perCurrency) {
    bands[currency] = list;
    for (const band of list) band.ids.forEach((id) => bandIds.add(id));
  }
  bands[STORE_POLICY.currency]?.forEach((b) => claim(b.ids));

  const cta = pickDistinct(pool, (r) => r.type === "game", new Set([...claimed, ...bandIds]), MERCH.ctaCovers);
  const coverIds = [...door, ...lockerRows, ...genrePicks.flat(), ...cta].map((r) => r.id);
  const coverRows = coverIds.length
    ? await prisma.$queryRaw<{ productId: string; url: string }[]>`SELECT "productId", "url" FROM "ProductImage" WHERE "productId" = ANY(${coverIds}) AND "sortOrder" = 0`
    : [];
  const coverUrl = new Map(coverRows.map((r) => [r.productId, r.url]));
  const toCover = (r: PoolRow): CoverRef => ({ id: r.id, slug: r.slug, title: r.title, image: coverUrl.get(r.id) ?? "" });
  const platforms: HomePlatform[] = stocked.map((p, i) => {
    const info = platformInfo(p.key);
    return {
      key: p.key,
      slug: p.slug,
      name: p.label,
      short: info.short,
      tone: info.tone,
      href: `/platform/${p.slug}`,
      count: stats.get(p.key)?.count ?? 0,
      minPrice: stats.get(p.key)?.min ?? null,
      rank: i + 1,
      covers: lockerRows.filter((r) => r.platform === p.key).map(toCover),
    };
  });

  const genres: HomeGenre[] = topGenres.map((g, i) => ({ key: g.genre, label: known.get(g.genre)!, href: `/genre/${g.genre}`, count: g.count, covers: genrePicks[i].map(toCover) }));

  const [feature, rail, releaseProducts, bandList] = await Promise.all([
    loadKeyProducts(featureRow.map((r) => r.id)),
    loadKeyProducts(railRows.map((r) => r.id)),
    showReleases ? loadKeyProducts(releaseRows.map((r) => r.id)) : Promise.resolve([] as CatalogProduct[]),
    loadKeyProducts([...bandIds]),
  ]);
  const releaseById = new Map(releaseProducts.map((p) => [p.id, p]));

  const byPlatform = new Map<string, GiftCardGroup[]>();
  for (const g of groups) byPlatform.set(g.platform, [...(byPlatform.get(g.platform) ?? []), g]);
  const giftCards = [...byPlatform.values()]
    .map((list) => [...list].sort((a, b) => b.products.length - a.products.length)[0]!)
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, MERCH.giftCardPlatforms);

  const base = ["steam", "epic", "ea-app", "ubisoft-connect", "xbox", "playstation", "nintendo"];
  const extra = ["gog", "battle-net"].filter((k) => (stats.get(k)?.count ?? 0) > 0);

  return {
    live: totals[0]?.live ?? 0,
    onSale: totals[0]?.sale ?? 0,
    syncedAt: syncRows[0]?.finishedAt ? syncRows[0].finishedAt.toISOString() : null,
    types,
    platforms,
    doorCovers: door.map(toCover),
    ctaCovers: cta.map(toCover),
    deals: { total: totals[0]?.sale ?? 0, feature: feature[0] ?? null, rail },
    genres,
    releases: {
      items: showReleases ? releaseRows.flatMap((r) => (releaseById.has(r.id) ? [{ product: releaseById.get(r.id)!, releaseDate: r.releaseDate.toISOString() }] : [])) : [],
      weeks,
      total: weekRows.reduce((a, r) => a + r.count, 0),
      now,
    },
    giftCards,
    timetable: homeTimetable(timetable, MERCH.timetableRows),
    activationPlatforms: [...base, ...extra],
    bands,
    bandProducts: Object.fromEntries(bandList.map((p) => [p.id, p])),
  };
}

const homeData = memoize(5 * 60_000, computeHomeData, { staleMs: 60 * 60_000 });

export const getHomeData = cache((): Promise<HomeData> => homeData());
