import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EXTERIORS, WEAPON_TYPES, raritySlug, type RaritySlug } from "@/lib/skins/cs2";
import { loadSkinProducts } from "@/components/catalog/catalog-query";
import { MERCH, PRICE_BANDS } from "@/config/merchandising";
import type { HomeData, HomeRarityTier } from "./types";

interface IdRow {
  id: string;
}

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND (p."trackInventory" = false OR p."quantity" > 0)`;
const HAS_RENDER = Prisma.sql`EXISTS (SELECT 1 FROM "ProductImage" i WHERE i."productId" = p."id")`;

function notIn(ids: Set<string>) {
  return ids.size ? Prisma.sql`AND p."id" NOT IN (${Prisma.join([...ids])})` : Prisma.empty;
}

const TIER_KEYS: Record<RaritySlug, string[]> = {
  consumer: ["consumer"],
  industrial: ["industrial"],
  milspec: ["mil-spec"],
  restricted: ["restricted"],
  classified: ["classified"],
  covert: ["covert"],
  gold: ["extraordinary", "contraband"],
};

const TIER_LABEL: Record<RaritySlug, string> = {
  consumer: "Consumer Grade",
  industrial: "Industrial Grade",
  milspec: "Mil-Spec Grade",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  gold: "Extraordinary",
};

export async function getHomeData(): Promise<HomeData> {
  const claimed = new Set<string>();
  const claim = (ids: string[]) => ids.forEach((id) => claimed.add(id));

  const [typeRows, rarityRows, totals, markCounts] = await Promise.all([
    prisma.$queryRaw<{ weaponType: string; count: number; min: number }[]>`
      SELECT s."weaponType", COUNT(*)::int AS count, MIN(p."price")::float AS min
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE}
      GROUP BY s."weaponType"`,
    prisma.$queryRaw<{ rarity: string; count: number }[]>`
      SELECT s."rarity", COUNT(*)::int AS count
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE}
      GROUP BY s."rarity"`,
    prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "Product" p WHERE ${LIVE}`,
    prisma.$queryRaw<{ stattrak: number; souvenir: number }[]>`
      SELECT COUNT(*) FILTER (WHERE s."isStatTrak")::int AS stattrak, COUNT(*) FILTER (WHERE s."isSouvenir")::int AS souvenir
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE}`,
  ]);

  const featured = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p
    WHERE ${LIVE} AND ${HAS_RENDER} AND p."isFeatured" = true
    ORDER BY p."price" DESC LIMIT 1`;
  const heroRow = featured[0]
    ? featured
    : await prisma.$queryRaw<IdRow[]>`
        SELECT p."id" FROM "Product" p JOIN "Skin" s ON s."productId" = p."id"
        WHERE ${LIVE} AND ${HAS_RENDER} AND (s."weaponType" IN ('knives', 'gloves') OR s."rarity" = 'covert')
        ORDER BY p."price" DESC LIMIT 1`;
  claim(heroRow.map((r) => r.id));

  const typeStats = new Map(typeRows.map((r) => [r.weaponType, r]));
  const bayRenders = await prisma.$queryRaw<{ weaponType: string; id: string }[]>`
    SELECT DISTINCT ON (s."weaponType") s."weaponType", p."id"
    FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
    WHERE ${LIVE} AND ${HAS_RENDER} ${notIn(claimed)}
    ORDER BY s."weaponType", p."price" DESC`;
  claim(bayRenders.map((r) => r.id));
  const bayProducts = await loadSkinProducts(bayRenders.map((r) => r.id));
  const bayByType = new Map(bayRenders.map((r) => [r.weaponType, bayProducts.find((p) => p.id === r.id) ?? null]));

  const types = WEAPON_TYPES.map((type) => {
    const stat = typeStats.get(type.key);
    return { key: type.key, name: type.label, count: stat?.count ?? 0, minPrice: stat?.min ?? null, render: bayByType.get(type.key) ?? null };
  }).filter((t) => t.count > 0);

  const heroWeapon = heroRow[0] ? (await prisma.skin.findUnique({ where: { productId: heroRow[0].id }, select: { weapon: true } }))?.weapon ?? "" : "";
  const knives = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (s."weapon") p."id", p."price"
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE} AND ${HAS_RENDER} AND s."weaponType" = 'knives' AND s."skinName" IS NOT NULL AND s."weapon" <> ${heroWeapon} ${notIn(claimed)}
      ORDER BY s."weapon", p."price" DESC
    ) x ORDER BY x."price" DESC LIMIT ${MERCH.spotlightKnives}`;
  claim(knives.map((r) => r.id));
  const gloves = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (s."weapon") p."id", p."price"
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE} AND ${HAS_RENDER} AND s."weaponType" = 'gloves' AND s."weapon" <> ${heroWeapon} ${notIn(claimed)}
      ORDER BY s."weapon", p."price" DESC
    ) x ORDER BY x."price" DESC LIMIT ${MERCH.spotlightGloves}`;
  claim(gloves.map((r) => r.id));

  const bands = [];
  for (const band of PRICE_BANDS) {
    const lower = band.min !== null ? Prisma.sql`AND p."price" >= ${band.min}` : Prisma.empty;
    const upper = band.max !== null ? Prisma.sql`AND p."price" < ${band.max}` : Prisma.empty;
    const rows = await prisma.$queryRaw<{ id: string; price: number; rank: number }[]>`
      SELECT p."id", p."price"::float AS price, COALESCE(array_position(ARRAY['consumer','industrial','mil-spec','restricted','classified','covert','extraordinary','contraband']::text[], s."rarity"), 0) AS rank
      FROM "Product" p JOIN "Skin" s ON s."productId" = p."id"
      WHERE ${LIVE} AND ${HAS_RENDER} ${lower} ${upper} ${notIn(claimed)}
      ORDER BY p."price" ASC`;
    if (rows.length < MERCH.bandMinimum) continue;
    const step = rows.length / Math.min(MERCH.bandItems, rows.length);
    const picks = Array.from({ length: Math.min(MERCH.bandItems, rows.length) }, (_, i) => rows[Math.min(rows.length - 1, Math.floor(i * step + step / 2))]);
    const unique = [...new Map(picks.map((r) => [r.id, r])).values()];
    const feature = [...unique].sort((a, b) => b.rank - a.rank || b.price - a.price)[0];
    const ordered = [feature, ...unique.filter((r) => r.id !== feature.id)];
    claim(ordered.map((r) => r.id));
    bands.push({ key: band.key, min: band.min, max: band.max, total: rows.length, products: await loadSkinProducts(ordered.map((r) => r.id)) });
  }

  const tierCounts = new Map<RaritySlug, number>();
  for (const r of rarityRows) {
    const slug = raritySlug(r.rarity);
    if (slug) tierCounts.set(slug, (tierCounts.get(slug) ?? 0) + r.count);
  }
  const tierSlugs = Object.keys(TIER_KEYS) as RaritySlug[];
  const tierPicks = await Promise.all(
    tierSlugs.map(async (slug) => {
      const rows = await prisma.$queryRaw<IdRow[]>`
        SELECT p."id" FROM "Product" p JOIN "Skin" s ON s."productId" = p."id"
        WHERE ${LIVE} AND ${HAS_RENDER} AND s."rarity" IN (${Prisma.join(TIER_KEYS[slug])}) ${notIn(claimed)}
        ORDER BY p."price" DESC LIMIT 1`;
      return rows[0]?.id ?? null;
    }),
  );
  claim(tierPicks.filter((id): id is string => Boolean(id)));
  const tierProducts = await loadSkinProducts(tierPicks.filter((id): id is string => Boolean(id)));
  const contrabandCount = rarityRows.find((r) => r.rarity === "contraband")?.count ?? 0;
  const rarities: HomeRarityTier[] = tierSlugs.map((slug, i) => ({
    slug,
    label: slug === "gold" && contrabandCount > 0 ? "Extraordinary & Contraband" : TIER_LABEL[slug],
    keys: TIER_KEYS[slug],
    count: tierCounts.get(slug) ?? 0,
    product: tierProducts.find((p) => p.id === tierPicks[i]) ?? null,
  }));

  const walkSkin = await prisma.$queryRaw<{ weapon: string; skinName: string }[]>`
    SELECT s."weapon", s."skinName"
    FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
    WHERE ${LIVE} AND ${HAS_RENDER} AND s."skinName" IS NOT NULL AND s."exterior" IS NOT NULL AND s."isStatTrak" = false AND s."isSouvenir" = false AND s."phase" IS NULL ${notIn(claimed)}
    GROUP BY s."weapon", s."skinName"
    HAVING COUNT(DISTINCT s."exterior") = ${EXTERIORS.length}
    ORDER BY MAX(p."price") DESC LIMIT 1`;
  let walkIds: (string | null)[] = [];
  if (walkSkin[0]) {
    const rows = await prisma.$queryRaw<{ exterior: string; id: string }[]>`
      SELECT DISTINCT ON (s."exterior") s."exterior", p."id"
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE ${LIVE} AND ${HAS_RENDER} AND s."weapon" = ${walkSkin[0].weapon} AND s."skinName" = ${walkSkin[0].skinName} AND s."isStatTrak" = false AND s."isSouvenir" = false ${notIn(claimed)}
      ORDER BY s."exterior", p."price" ASC`;
    walkIds = EXTERIORS.map((e) => rows.find((r) => r.exterior === e.code)?.id ?? null);
  } else {
    walkIds = await Promise.all(
      EXTERIORS.map(async (e) => {
        const rows = await prisma.$queryRaw<IdRow[]>`
          SELECT p."id" FROM "Product" p JOIN "Skin" s ON s."productId" = p."id"
          WHERE ${LIVE} AND ${HAS_RENDER} AND s."exterior" = ${e.code} ${notIn(claimed)}
          ORDER BY p."price" DESC LIMIT 1`;
        return rows[0]?.id ?? null;
      }),
    );
  }
  claim(walkIds.filter((id): id is string => Boolean(id)));
  const walkProducts = await loadSkinProducts(walkIds.filter((id): id is string => Boolean(id)));
  const wear = EXTERIORS.map((e, i) => ({ code: e.code, product: walkProducts.find((p) => p.id === walkIds[i]) ?? null }));

  const marks = async (column: "isStatTrak" | "isSouvenir", limit: number) => {
    const rows = await prisma.$queryRaw<IdRow[]>`
      SELECT id FROM (
        SELECT DISTINCT ON (s."weaponType") p."id", p."price"
        FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
        WHERE ${LIVE} AND ${HAS_RENDER} AND s.${Prisma.raw(`"${column}"`)} = true ${notIn(claimed)}
        ORDER BY s."weaponType", p."price" DESC
      ) x ORDER BY x."price" DESC LIMIT ${limit}`;
    claim(rows.map((r) => r.id));
    return loadSkinProducts(rows.map((r) => r.id));
  };
  const stattrak = await marks("isStatTrak", MERCH.stattrak);
  const souvenir = await marks("isSouvenir", MERCH.souvenir);

  const newest = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p
    WHERE ${LIVE} AND ${HAS_RENDER} ${notIn(claimed)}
    ORDER BY p."createdAt" DESC, p."id" ASC LIMIT ${MERCH.newest}`;
  claim(newest.map((r) => r.id));

  const drops = await prisma.$queryRaw<IdRow[]>`
    SELECT p."id" FROM "Product" p
    WHERE ${LIVE} AND ${HAS_RENDER} AND p."comparePrice" IS NOT NULL AND p."comparePrice" > p."price" ${notIn(claimed)}
    ORDER BY (p."comparePrice" - p."price") / p."comparePrice" DESC LIMIT 4`;

  const [hero, knifeProducts, gloveProducts, newestProducts, dropProducts] = await Promise.all([
    loadSkinProducts(heroRow.map((r) => r.id)),
    loadSkinProducts(knives.map((r) => r.id)),
    loadSkinProducts(gloves.map((r) => r.id)),
    loadSkinProducts(newest.map((r) => r.id)),
    loadSkinProducts(drops.map((r) => r.id)),
  ]);

  return {
    totalProducts: totals[0]?.count ?? 0,
    hero: hero[0] ?? null,
    types,
    knives: knifeProducts,
    gloves: gloveProducts,
    bands,
    rarities,
    wear,
    wearSkin: walkSkin[0] ? `${walkSkin[0].weapon} | ${walkSkin[0].skinName}` : null,
    stattrak: { count: markCounts[0]?.stattrak ?? 0, products: stattrak },
    souvenir: { count: markCounts[0]?.souvenir ?? 0, products: souvenir },
    newest: newestProducts,
    drops: dropProducts,
  };
}
