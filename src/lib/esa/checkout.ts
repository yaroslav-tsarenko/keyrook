import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { STORE_POLICY, perItemLimit } from "@/config/store-policy";
import { computeTotals, rateConverter } from "@/lib/pricing";
import { getRate, isSupportedCurrency, type SupportedCurrency } from "@/lib/exchange-rates";
import { displayOrderNumber } from "@/lib/orders";
import { getPaymentProvider, PaymentUnavailableError } from "@/lib/payments/provider";
import { keySpecText, productTypeDef } from "@/lib/keys/taxonomy";
import { ageOn } from "@/lib/validators/fields";
import { esaClient } from "./client";
import { classifyProduct } from "./classify";
import { computeSellPrice, round2 } from "./pricing";
import { logKeyEvent } from "./events";
import { applySupplyUpdate } from "./refresh";

export class KeyCheckoutError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export interface QuoteItemInput {
  productId: string;
  quantity?: number;
}

export interface KeyQuoteLine {
  productId: string;
  name: string;
  spec: string | null;
  sku: string;
  productType: string;
  quantity: number;
  basePrice: number;
  unit: number;
  total: number;
}

export interface KeyQuote {
  currency: SupportedCurrency;
  rate: number;
  lines: KeyQuoteLine[];
  base: ReturnType<typeof computeTotals>;
  charge: ReturnType<typeof computeTotals>;
}

export function publicKeyQuote(quote: KeyQuote) {
  return {
    currency: quote.currency,
    discount: null,
    codeRejected: false,
    lines: quote.lines.map(({ productId, name, spec, quantity, unit, total }) => ({ productId, name, variantName: spec, quantity, unit, total })),
    totals: quote.charge,
  };
}

function mergeItems(items: QuoteItemInput[]): { productId: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + Math.max(1, Math.floor(item.quantity ?? 1)));
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

async function loadSellable(items: { productId: string; quantity: number }[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      status: true,
      quantity: true,
      item: { select: { productType: true, platform: true, region: true, edition: true, languages: true, genres: true, releaseYear: true, validity: true } },
      supply: { select: { esaId: true, esaProductId: true, offerId: true, costPrice: true, qty: true, isAvailable: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product || product.status !== "ACTIVE" || !product.item || !product.supply || !product.supply.isAvailable || product.quantity <= 0) {
      throw new KeyCheckoutError("PRODUCT_UNAVAILABLE", 409, { productId, name: product?.name ?? null });
    }
    const cap = perItemLimit(product.item.productType);
    if (quantity > cap) throw new KeyCheckoutError("ITEM_LIMIT", 409, { productId, name: product.name, max: cap });
    if (quantity > product.quantity) throw new KeyCheckoutError("PRODUCT_UNAVAILABLE", 409, { productId, name: product.name });
    return { ...product, item: product.item, supply: product.supply, quantity };
  });
}

type Sellable = Awaited<ReturnType<typeof loadSellable>>[number];

function assertOrderLimits(products: Sellable[]) {
  const units = products.reduce((sum, p) => sum + p.quantity, 0);
  if (units > STORE_POLICY.limits.maxItemsPerOrder) throw new KeyCheckoutError("ORDER_LIMIT", 409, { max: STORE_POLICY.limits.maxItemsPerOrder });
  const value = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
  if (value > STORE_POLICY.limits.maxOrderValue) throw new KeyCheckoutError("ORDER_VALUE_LIMIT", 409, { max: STORE_POLICY.limits.maxOrderValue });
}

async function assertCustomerLimits(userId: string, products: Sellable[]) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [type, limit] of Object.entries(STORE_POLICY.limits.perCustomer24h)) {
    if (!limit) continue;
    const wanted = products.filter((p) => p.item.productType === type);
    if (wanted.length === 0) continue;
    const recent = await prisma.keyOrder.findMany({
      where: { userId, createdAt: { gte: since }, status: { notIn: ["refunded"] }, order: { paymentStatus: { in: ["PAID", "PENDING"] } } },
      select: { quantity: true, shownPrice: true, productId: true },
    });
    const ids = recent.map((r) => r.productId);
    const types = ids.length ? await prisma.keyItem.findMany({ where: { productId: { in: ids } }, select: { productId: true, productType: true } }) : [];
    const typeOf = new Map(types.map((t) => [t.productId, t.productType]));
    const prior = recent.filter((r) => typeOf.get(r.productId) === type);
    const units = prior.reduce((s, r) => s + r.quantity, 0) + wanted.reduce((s, p) => s + p.quantity, 0);
    const value = prior.reduce((s, r) => s + Number(r.shownPrice) * r.quantity, 0) + wanted.reduce((s, p) => s + Number(p.price) * p.quantity, 0);
    if (units > limit.units || value > limit.value) {
      throw new KeyCheckoutError("CUSTOMER_LIMIT", 409, { type: productTypeDef(type)?.label ?? type, max: limit.units, value: limit.value });
    }
  }
}

export async function buildKeyQuote(input: { items: QuoteItemInput[]; currency?: string | null }): Promise<KeyQuote> {
  const items = mergeItems(input.items);
  if (items.length === 0) throw new KeyCheckoutError("CART_EMPTY");
  const currency: SupportedCurrency = isSupportedCurrency(input.currency) ? input.currency : STORE_POLICY.currency;
  const products = await loadSellable(items);
  assertOrderLimits(products);
  const rate = await getRate(currency);
  const pricing = products.map((p) => ({ price: Number(p.price), quantity: p.quantity }));
  const base = computeTotals(pricing);
  const charge = computeTotals(pricing, { convert: rateConverter(rate) });
  return {
    currency,
    rate,
    base,
    charge,
    lines: products.map((p, i) => ({
      productId: p.id,
      name: p.name,
      spec: keySpecText({ ...p.item, edition: p.item.edition, validity: p.item.validity }),
      sku: p.sku,
      productType: p.item.productType,
      quantity: p.quantity,
      basePrice: pricing[i].price,
      unit: charge.lines[i].unit,
      total: charge.lines[i].total,
    })),
  };
}

interface LivePrice {
  productId: string;
  costPrice: number;
  shownPrice: number;
  repriced: boolean;
}

async function confirmLivePrices(products: Sellable[]): Promise<LivePrice[]> {
  const results: LivePrice[] = [];
  for (const product of products) {
    let live;
    try {
      live = await esaClient.getProduct(product.supply.esaProductId);
    } catch {
      throw new KeyCheckoutError("PRICE_UNAVAILABLE", 503, { productId: product.id, name: product.name });
    }
    const classified = live ? classifyProduct(live) : null;
    if (!classified || !classified.ok || classified.item.qty < product.quantity) {
      await applySupplyUpdate(product.id, { cost: null, qty: 0 });
      throw new KeyCheckoutError("PRODUCT_UNAVAILABLE", 409, { productId: product.id, name: product.name });
    }
    const liveCost = round2(classified.item.cost);
    const storedCost = Number(product.supply.costPrice);
    const storedSell = Number(product.price);
    const repriced = liveCost > storedCost * (1 + env.CATALOG_PRICE_TOLERANCE) || storedSell <= liveCost;
    const shownPrice = repriced ? computeSellPrice(liveCost) : storedSell;
    if (repriced || classified.item.qty !== product.supply.qty) {
      await applySupplyUpdate(product.id, { cost: repriced ? liveCost : null, qty: classified.item.qty });
    }
    results.push({ productId: product.id, costPrice: repriced ? liveCost : Math.max(liveCost, storedCost), shownPrice, repriced });
  }
  return results;
}

export interface KeyCheckoutInput {
  userId: string;
  items: QuoteItemInput[];
  currency?: string | null;
  expectedTotal: number;
  contact: { email: string; firstName: string; lastName: string; phone: string | null };
  billing: { firstName: string; lastName: string; address1: string; address2: string | null; city: string; postalCode: string; country: string };
  ip: string;
  baseUrl: string;
}

export async function createKeyCheckout(input: KeyCheckoutInput): Promise<{ orderId: string; paymentUrl: string }> {
  const provider = getPaymentProvider();
  if (!provider.available) throw new PaymentUnavailableError(provider.id);

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new KeyCheckoutError("UNAUTHORISED", 401);
  if (!user.dateOfBirth || ageOn(user.dateOfBirth) < STORE_POLICY.minAge) throw new KeyCheckoutError("AGE_REQUIRED", 409);

  const items = mergeItems(input.items);
  if (items.length === 0) throw new KeyCheckoutError("CART_EMPTY");
  const products = await loadSellable(items);
  assertOrderLimits(products);
  await assertCustomerLimits(user.id, products);
  const live = await confirmLivePrices(products);
  const quote = await buildKeyQuote({ items, currency: input.currency });
  if (live.some((l) => l.repriced) || Math.abs(quote.charge.total - input.expectedTotal) > 0.009) {
    throw new KeyCheckoutError("TOTAL_CHANGED", 409, { quote: publicKeyQuote(quote) });
  }

  const liveById = new Map(live.map((l) => [l.productId, l]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const now = new Date();
  const address = {
    firstName: input.billing.firstName,
    lastName: input.billing.lastName,
    address1: input.billing.address1,
    address2: input.billing.address2,
    city: input.billing.city,
    postalCode: input.billing.postalCode,
    country: input.billing.country.toUpperCase(),
  };

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: user.id,
        customerName: `${input.contact.firstName} ${input.contact.lastName}`.trim(),
        customerEmail: input.contact.email,
        customerPhone: input.contact.phone,
        shippingAddress: address,
        billingAddress: address,
        shippingMethod: "digital_key",
        shippingCost: 0,
        subtotal: quote.base.subtotal,
        taxAmount: quote.base.vat,
        discountAmount: 0,
        total: quote.base.total,
        currency: quote.currency,
        exchangeRate: quote.rate,
        chargeTotal: quote.charge.total,
        termsAcceptedAt: now,
        waiverAcceptedAt: now,
        waiverText: STORE_POLICY.waiver.text,
        waiverVersion: STORE_POLICY.waiver.version,
        paymentMethod: "card",
        items: {
          create: quote.lines.map((line, index) => ({
            productId: line.productId,
            productName: line.name,
            productSku: line.sku,
            variantName: line.spec,
            quantity: line.quantity,
            price: line.basePrice,
            total: quote.base.lines[index].total,
          })),
        },
      },
      include: { items: true },
    });
    for (const item of created.items) {
      const price = liveById.get(item.productId)!;
      const product = productById.get(item.productId)!;
      await tx.keyOrder.create({
        data: {
          orderId: created.id,
          orderItemId: item.id,
          userId: user.id,
          productId: item.productId,
          esaId: product.supply.esaId,
          esaProductId: product.supply.esaProductId,
          offerId: product.supply.offerId,
          quantity: item.quantity,
          shownPrice: new Prisma.Decimal(price.shownPrice),
          costPrice: new Prisma.Decimal(price.costPrice),
          margin: new Prisma.Decimal(round2(price.shownPrice - price.costPrice)),
          currency: STORE_POLICY.currency,
          status: "awaiting_payment",
        },
      });
    }
    return created;
  });

  const keyOrders = await prisma.keyOrder.findMany({ where: { orderId: order.id }, select: { id: true } });
  for (const k of keyOrders) await logKeyEvent({ keyOrderId: k.id, source: "system", toStatus: "awaiting_payment" });

  try {
    const { redirectUrl, providerRef } = await provider.createPayment({
      order: { id: order.id, number: displayOrderNumber(order.orderNumber), description: `Order ${displayOrderNumber(order.orderNumber)}` },
      amount: quote.charge.total,
      currency: quote.currency,
      returnUrl: `${input.baseUrl}/order/confirmed?order=${order.id}`,
      cancelUrl: `${input.baseUrl}/checkout?payment=failed`,
      webhookUrl: `${input.baseUrl}/api/webhooks/payment/${provider.id}`,
      customer: {
        id: user.id,
        email: input.contact.email,
        firstName: input.billing.firstName || input.contact.firstName,
        lastName: input.billing.lastName || input.contact.lastName,
        phone: input.contact.phone,
        ip: input.ip,
        billing: { address1: address.address1, address2: address.address2, city: address.city, postalCode: address.postalCode, country: address.country },
      },
    });
    if (!providerRef || !redirectUrl) throw new Error(`${provider.id} returned no redirect URL`);
    await prisma.order.update({ where: { id: order.id }, data: { paymentId: providerRef } });
    return { orderId: order.id, paymentUrl: redirectUrl };
  } catch (err) {
    console.error(`[key-checkout] payment init failed for order ${order.id}: ${String(err)}`);
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
    await prisma.keyOrder.updateMany({ where: { orderId: order.id, status: "awaiting_payment" }, data: { status: "failed", supplierError: "payment_init_failed" } });
    if (err instanceof PaymentUnavailableError) throw err;
    throw new KeyCheckoutError("PAYMENT_LINK_FAILED", 502);
  }
}
