import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { catalogConfig } from "@/config/catalog";
import { esaClient } from "./client";
import { classifyProduct } from "./classify";
import { computeSellPrice } from "./pricing";
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

export async function refreshCatalog(): Promise<RefreshResult> {
  const t0 = Date.now();
  const rows = await prisma.supplyItem.findMany({ where: { product: { status: "ACTIVE" } }, select: { productId: true, esaId: true } });
  const result: RefreshResult = { checked: 0, repriced: 0, soldOut: 0, restocked: 0, missing: 0, durationMs: 0 };
  const batch = catalogConfig.sync.refreshBatch;
  for (let i = 0; i < rows.length; i += batch) {
    const chunk = rows.slice(i, i + batch);
    let products: EsaProduct[];
    try {
      products = (await esaClient.listProducts({ page: 1, limit: batch, kinguinId: chunk.map((r) => r.esaId) })).results;
    } catch (err) {
      console.error(`[catalog-refresh] batch ${i / batch} failed: ${String(err)}`);
      continue;
    }
    const byId = new Map(products.map((p) => [p.kinguinId, p]));
    for (const row of chunk) {
      result.checked++;
      const product = byId.get(row.esaId);
      const outcome = await applySupplyUpdate(row.productId, product ? liveTerms(product) : { cost: null, qty: 0 });
      if (!product) result.missing++;
      if (outcome === "repriced") result.repriced++;
      if (outcome === "sold_out") result.soldOut++;
      if (outcome === "restocked") result.restocked++;
    }
  }
  result.durationMs = Date.now() - t0;
  console.log(`[catalog-refresh] checked=${result.checked} repriced=${result.repriced} soldOut=${result.soldOut} restocked=${result.restocked} missing=${result.missing} in ${result.durationMs}ms`);
  return result;
}
