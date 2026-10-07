import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { catalogConfig } from "@/config/catalog";
import { esaClient } from "./client";
import { classifyProduct } from "./classify";
import { computeSellPrice } from "./pricing";
import { refreshPlannerStats } from "./sync";
import type { EsaProduct } from "./types";

export interface RefreshResult {
  checked: number;
  repriced: number;
  soldOut: number;
  restocked: number;
  missing: number;
  durationMs: number;
}

export async function applySupplyUpdate(productId: string, update: { cost: number | null; qty: number; offerId?: string | null }): Promise<"repriced" | "sold_out" | "restocked" | "unchanged"> {
  const row = await prisma.supplyItem.findUnique({ where: { productId }, select: { costPrice: true, qty: true, product: { select: { quantity: true, item: { select: { productType: true } } } } } });
  if (!row) return "unchanged";
  const type = (row.product.item?.productType ?? "game") as keyof typeof catalogConfig.pricing.maxPriceByType;
  const cost = update.cost ?? Number(row.costPrice);
  const sell = computeSellPrice(cost, { margin: env.CATALOG_MARGIN, minMarginAbs: env.CATALOG_MIN_MARGIN_ABS });
  const sellable = update.qty >= catalogConfig.include.minTextQty && sell <= catalogConfig.pricing.maxPriceByType[type] && sell >= catalogConfig.pricing.minPrice;
  const qty = sellable ? update.qty : 0;
  const priceChanged = Math.abs(cost - Number(row.costPrice)) >= 0.005;
  await prisma.$transaction([
    prisma.supplyItem.update({
      where: { productId },
      data: { qty, isAvailable: qty > 0, syncedAt: new Date(), ...(update.offerId !== undefined ? { offerId: update.offerId } : {}), ...(priceChanged ? { costPrice: new Prisma.Decimal(cost), sellPrice: new Prisma.Decimal(sell) } : {}) },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { quantity: qty, ...(priceChanged ? { price: new Prisma.Decimal(sell), costPrice: new Prisma.Decimal(cost), comparePrice: null } : {}) },
    }),
  ]);
  if (qty === 0 && row.product.quantity > 0) return "sold_out";
  if (qty > 0 && row.product.quantity === 0) return "restocked";
  return priceChanged ? "repriced" : "unchanged";
}

function liveTerms(product: EsaProduct): { cost: number | null; qty: number; offerId: string | null } {
  const result = classifyProduct(product);
  if (!result.ok) return { cost: null, qty: 0, offerId: null };
  return { cost: result.item.cost, qty: result.item.qty, offerId: result.item.offerId };
}

interface RefreshRow {
  productId: string;
  esaId: number;
  costPrice: number;
  quantity: number;
  productType: string | null;
}

type Outcome = "repriced" | "sold_out" | "restocked" | "unchanged";

async function applyBatch(rows: RefreshRow[], live: Map<number, EsaProduct>, now: Date): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  const values = rows.map((row) => {
    const terms = live.get(row.esaId) ? liveTerms(live.get(row.esaId)!) : { cost: null, qty: 0, offerId: null };
    const type = (row.productType ?? "game") as keyof typeof catalogConfig.pricing.maxPriceByType;
    const cost = terms.cost ?? row.costPrice;
    const sell = computeSellPrice(cost, { margin: env.CATALOG_MARGIN, minMarginAbs: env.CATALOG_MIN_MARGIN_ABS });
    const sellable = terms.qty >= catalogConfig.include.minTextQty && sell <= catalogConfig.pricing.maxPriceByType[type] && sell >= catalogConfig.pricing.minPrice;
    const qty = sellable ? terms.qty : 0;
    const priceChanged = Math.abs(cost - row.costPrice) >= 0.005;
    outcomes.push(qty === 0 && row.quantity > 0 ? "sold_out" : qty > 0 && row.quantity === 0 ? "restocked" : priceChanged ? "repriced" : "unchanged");
    return Prisma.sql`(${row.productId}::text, ${qty}::int, ${priceChanged}::boolean, ${cost}::numeric, ${sell}::numeric, ${terms.offerId}::text)`;
  });
  const table = Prisma.sql`(VALUES ${Prisma.join(values)}) AS v("productId", "qty", "priceChanged", "cost", "sell", "offerId")`;
  await prisma.$transaction([
    prisma.$executeRaw`
      UPDATE "SupplyItem" s SET
        "qty" = v."qty",
        "isAvailable" = v."qty" > 0,
        "syncedAt" = ${now},
        "offerId" = COALESCE(v."offerId", s."offerId"),
        "costPrice" = CASE WHEN v."priceChanged" THEN v."cost" ELSE s."costPrice" END,
        "sellPrice" = CASE WHEN v."priceChanged" THEN v."sell" ELSE s."sellPrice" END,
        "updatedAt" = ${now}
      FROM ${table}
      WHERE s."productId" = v."productId"`,
    prisma.$executeRaw`
      UPDATE "Product" p SET
        "quantity" = v."qty",
        "price" = CASE WHEN v."priceChanged" THEN v."sell" ELSE p."price" END,
        "costPrice" = CASE WHEN v."priceChanged" THEN v."cost" ELSE p."costPrice" END,
        "comparePrice" = CASE WHEN v."priceChanged" THEN NULL ELSE p."comparePrice" END,
        "updatedAt" = ${now}
      FROM ${table}
      WHERE p."id" = v."productId"`,
  ]);
  return outcomes;
}

export async function refreshCatalog(options: { budgetMs?: number | null; log?: (line: string) => void } = {}): Promise<RefreshResult> {
  const t0 = Date.now();
  const budget = options.budgetMs === undefined ? catalogConfig.sync.refreshBudgetMs : options.budgetMs;
  const rows = await prisma.$queryRaw<RefreshRow[]>`
    SELECT s."productId", s."esaId", s."costPrice"::float AS "costPrice", p."quantity", k."productType"
    FROM "SupplyItem" s JOIN "Product" p ON p."id" = s."productId" LEFT JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE p."status" = 'ACTIVE'::"ProductStatus"
    ORDER BY s."syncedAt" ASC, s."productId" ASC`;
  const result: RefreshResult = { checked: 0, repriced: 0, soldOut: 0, restocked: 0, missing: 0, durationMs: 0 };
  const batch = catalogConfig.sync.refreshBatch;
  const batches = Array.from({ length: Math.ceil(rows.length / batch) }, (_, i) => rows.slice(i * batch, (i + 1) * batch));
  let done = 0;
  const worker = async () => {
    for (let chunk = batches.shift(); chunk; chunk = batches.shift()) {
      if (budget !== null && Date.now() - t0 > budget) return;
      let products: EsaProduct[];
      try {
        products = (await esaClient.listProducts({ page: 1, limit: batch, kinguinId: chunk.map((r) => r.esaId) })).results;
      } catch (err) {
        console.error(`[catalog-refresh] batch failed: ${String(err)}`);
        continue;
      }
      const live = new Map(products.map((p) => [p.kinguinId, p]));
      const outcomes = await applyBatch(chunk, live, new Date());
      result.checked += chunk.length;
      result.missing += chunk.filter((r) => !live.has(r.esaId)).length;
      for (const outcome of outcomes) {
        if (outcome === "repriced") result.repriced++;
        if (outcome === "sold_out") result.soldOut++;
        if (outcome === "restocked") result.restocked++;
      }
      done++;
      if (options.log && done % 50 === 0) options.log(`[catalog-refresh] ${result.checked}/${rows.length} checked`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, catalogConfig.sync.refreshConcurrency) }, worker));
  if (result.checked > 0) await refreshPlannerStats().catch((err) => console.error(`[catalog-refresh] planner stats: ${String(err)}`));
  result.durationMs = Date.now() - t0;
  console.log(`[catalog-refresh] checked=${result.checked}/${rows.length} repriced=${result.repriced} soldOut=${result.soldOut} restocked=${result.restocked} missing=${result.missing} in ${result.durationMs}ms${result.checked < rows.length ? " (time budget reached; the next run continues with the stalest products)" : ""}`);
  return result;
}
