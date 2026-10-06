import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { STORE_POLICY } from "@/config/store-policy";
import { computeTotals, rateConverter } from "@/lib/pricing";
import { getRate, isSupportedCurrency, type SupportedCurrency } from "@/lib/exchange-rates";
import { displayOrderNumber } from "@/lib/orders";
import { getPaymentProvider, PaymentUnavailableError } from "@/lib/payments/provider";
import { canonicalTradeUrl } from "@/lib/steam";
import { sendAlert } from "@/lib/alerts/telegram";
import { skinSpecText } from "@/lib/skins/cs2";
import { ageOn } from "@/lib/validators/fields";
import { sihClient } from "./client";
import { computeSellPrice, round2 } from "./pricing";
import { logSihEvent, applySihOrderObject } from "./orders";
import { refreshOrderStatus } from "./order-status";
import { SihError, userMessageForSih } from "./errors";

export class SkinCheckoutError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export interface SkinQuoteLine {
  productId: string;
  name: string;
  spec: string | null;
  sku: string;
  marketHashName: string;
  basePrice: number;
  unit: number;
  total: number;
}

export interface SkinQuote {
  currency: SupportedCurrency;
  rate: number;
  lines: SkinQuoteLine[];
  base: ReturnType<typeof computeTotals>;
  charge: ReturnType<typeof computeTotals>;
}

export function publicSkinQuote(quote: SkinQuote) {
  return {
    currency: quote.currency,
    discount: null,
    codeRejected: false,
    lines: quote.lines.map(({ productId, name, spec, unit, total }) => ({ productId, name, variantName: spec, quantity: 1, unit, total })),
    totals: quote.charge,
  };
}

function uniqueIds(items: { productId: string }[]): string[] {
  return [...new Set(items.map((i) => i.productId))];
}

async function loadSellable(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      status: true,
      quantity: true,
      skin: { select: { exterior: true, floatMin: true, floatMax: true, phase: true, isStatTrak: true, isSouvenir: true } },
      sihItem: { select: { marketHashName: true, appId: true, costPrice: true, sellPrice: true, count: true, isAvailable: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return productIds.map((id) => {
    const product = byId.get(id);
    if (!product || product.status !== "ACTIVE" || product.quantity <= 0 || !product.sihItem || !product.sihItem.isAvailable || product.sihItem.count <= 0) {
      throw new SkinCheckoutError("PRODUCT_UNAVAILABLE", 409, { productId: id, name: product?.name ?? null });
    }
    return { ...product, sihItem: product.sihItem };
  });
}

export async function buildSkinQuote(input: { items: { productId: string }[]; currency?: string | null }): Promise<SkinQuote> {
  const ids = uniqueIds(input.items);
  if (ids.length === 0) throw new SkinCheckoutError("CART_EMPTY");
  if (ids.length > STORE_POLICY.limits.maxItemsPerOrder) {
    throw new SkinCheckoutError("ORDER_LIMIT", 409, { max: STORE_POLICY.limits.maxItemsPerOrder });
  }
  const currency: SupportedCurrency = isSupportedCurrency(input.currency) ? input.currency : STORE_POLICY.currency;
  const products = await loadSellable(ids);
  const rate = await getRate(currency);
  const pricing = products.map((p) => ({ price: Number(p.price), quantity: 1 }));
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
      spec: skinSpecText(p.skin, true),
      sku: p.sku,
      marketHashName: p.sihItem.marketHashName,
      basePrice: pricing[i].price,
      unit: charge.lines[i].unit,
      total: charge.lines[i].total,
    })),
  };
}

interface LivePrice {
  productId: string;
  marketHashName: string;
  costPrice: number;
  shownPrice: number;
  repriced: boolean;
}

async function confirmLivePrices(products: Awaited<ReturnType<typeof loadSellable>>): Promise<LivePrice[]> {
  const results: LivePrice[] = [];
  for (const product of products) {
    const item = product.sihItem;
    let liveCost: number;
    let liveCount: number;
    try {
      const min = await sihClient.getMinItem(item.marketHashName, item.appId);
      if (!min.found || min.price == null || min.count <= 0) {
        await prisma.$transaction([
          prisma.sihItem.update({ where: { marketHashName: item.marketHashName }, data: { count: 0, isAvailable: false, syncedAt: new Date() } }),
          prisma.product.update({ where: { id: product.id }, data: { quantity: 0 } }),
        ]);
        throw new SkinCheckoutError("PRODUCT_UNAVAILABLE", 409, { productId: product.id, name: product.name });
      }
      liveCost = round2(min.price);
      liveCount = min.count;
    } catch (err) {
      if (err instanceof SkinCheckoutError) throw err;
      throw new SkinCheckoutError("PRICE_UNAVAILABLE", 503, { productId: product.id, name: product.name });
    }

    const storedCost = Number(item.costPrice);
    const storedSell = Number(product.price);
    const repriced = liveCost > storedCost * (1 + env.SIH_PRICE_TOLERANCE) || storedSell <= liveCost;
    const shownPrice = repriced ? computeSellPrice(liveCost) : storedSell;

    if (repriced || liveCount !== item.count) {
      await prisma.$transaction([
        prisma.sihItem.update({
          where: { marketHashName: item.marketHashName },
          data: {
            costPrice: new Prisma.Decimal(liveCost),
            sellPrice: new Prisma.Decimal(shownPrice),
            count: liveCount,
            syncedAt: new Date(),
          },
        }),
        prisma.product.update({ where: { id: product.id }, data: { price: new Prisma.Decimal(shownPrice), costPrice: new Prisma.Decimal(liveCost) } }),
      ]);
    }
    results.push({ productId: product.id, marketHashName: item.marketHashName, costPrice: liveCost, shownPrice, repriced });
  }
  return results;
}

export interface SkinCheckoutInput {
  userId: string;
  items: { productId: string }[];
  currency?: string | null;
  expectedTotal: number;
  contact: { email: string; firstName: string; lastName: string; phone: string | null };
  billing: { firstName: string; lastName: string; address1: string; address2: string | null; city: string; postalCode: string; country: string };
  ip: string;
  baseUrl: string;
}

export interface SkinCheckoutResult {
  orderId: string;
  paymentUrl: string;
}

export async function createSkinCheckout(input: SkinCheckoutInput): Promise<SkinCheckoutResult> {
  const provider = getPaymentProvider();
  if (!provider.available) throw new PaymentUnavailableError(provider.id);

  const user = await prisma.user.findUnique({ where: { id: input.userId }, include: { steamAccount: true } });
  if (!user) throw new SkinCheckoutError("UNAUTHORISED", 401);
  const steam = user.steamAccount;
  if (!steam) throw new SkinCheckoutError("STEAM_NOT_LINKED", 409);
  if (!steam.tradeUrlVerified || !steam.tradeToken || !steam.tradePartnerId) throw new SkinCheckoutError("TRADE_URL_REQUIRED", 409);
  if (!user.dateOfBirth || ageOn(user.dateOfBirth) < STORE_POLICY.minAge) throw new SkinCheckoutError("AGE_REQUIRED", 409);

  const ids = uniqueIds(input.items);
  if (ids.length === 0) throw new SkinCheckoutError("CART_EMPTY");
  if (ids.length > STORE_POLICY.limits.maxItemsPerOrder) {
    throw new SkinCheckoutError("ORDER_LIMIT", 409, { max: STORE_POLICY.limits.maxItemsPerOrder });
  }

  const products = await loadSellable(ids);
  const live = await confirmLivePrices(products);
  const quote = await buildSkinQuote({ items: ids.map((productId) => ({ productId })), currency: input.currency });
  if (live.some((l) => l.repriced) || Math.abs(quote.charge.total - input.expectedTotal) > 0.009) {
    throw new SkinCheckoutError("TOTAL_CHANGED", 409, { quote: publicSkinQuote(quote) });
  }

  const liveById = new Map(live.map((l) => [l.productId, l]));
  const now = new Date();
  const tradeUrl = canonicalTradeUrl({ partnerId: steam.tradePartnerId, token: steam.tradeToken });
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
        shippingMethod: "steam_trade",
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
        steamId: steam.steamId64,
        tradeUrl,
        paymentMethod: "card",
        items: {
          create: quote.lines.map((line, index) => ({
            productId: line.productId,
            productName: line.name,
            productSku: line.sku,
            variantName: line.spec,
            quantity: 1,
            price: line.basePrice,
            total: quote.base.lines[index].total,
          })),
        },
      },
      include: { items: true },
    });
    for (const item of created.items) {
      const price = liveById.get(item.productId)!;
      await tx.sihOrder.create({
        data: {
          orderId: created.id,
          orderItemId: item.id,
          userId: user.id,
          marketHashName: price.marketHashName,
          shownPrice: new Prisma.Decimal(price.shownPrice),
          costPrice: new Prisma.Decimal(price.costPrice),
          margin: new Prisma.Decimal(round2(price.shownPrice - price.costPrice)),
          currency: STORE_POLICY.currency,
          status: "awaiting_payment",
          steamId: steam.steamId64,
          tradeToken: steam.tradeToken!,
        },
      });
    }
    return created;
  });

  const sihOrders = await prisma.sihOrder.findMany({ where: { orderId: order.id }, select: { id: true } });
  for (const s of sihOrders) await logSihEvent({ orderId: s.id, source: "system", toStatus: "awaiting_payment" });

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
    console.error(`[skin-checkout] payment init failed for order ${order.id}: ${String(err)}`);
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
    await prisma.sihOrder.updateMany({ where: { orderId: order.id, status: "awaiting_payment" }, data: { status: "failed", sihError: "payment_init_failed" } });
    if (err instanceof PaymentUnavailableError) throw err;
    throw new SkinCheckoutError("PAYMENT_LINK_FAILED", 502);
  }
}

export async function submitOrderToSih(orderId: string): Promise<void> {
  const claim = await prisma.sihOrder.updateMany({
    where: { id: orderId, status: "paid" },
    data: { status: "submitted", submittedAt: new Date() },
  });
  if (claim.count === 0) return;

  const order = await prisma.sihOrder.findUnique({ where: { id: orderId } });
  if (!order) return;

  await logSihEvent({ orderId, source: "payment", fromStatus: "paid", toStatus: "submitted" });

  try {
    const result = await sihClient.createOrder({
      steamId: order.steamId,
      token: order.tradeToken,
      amount: Number(order.costPrice),
      item: order.marketHashName,
      customId: order.id,
    });
    await applySihOrderObject(orderId, result, "system");
  } catch (err) {
    const message = err instanceof SihError ? userMessageForSih(err.code) : "unexpected supplier failure";
    await prisma.sihOrder.update({
      where: { id: orderId },
      data: { status: "refund_pending", sihError: err instanceof SihError ? err.code : String(err).slice(0, 300) },
    });
    await logSihEvent({
      orderId,
      source: "system",
      fromStatus: "submitted",
      toStatus: "refund_pending",
      payload: { error: err instanceof SihError ? err.code : String(err) },
    });
    await sendAlert(
      `SIH order <b>${orderId}</b> failed after payment (${message}). Item: ${order.marketHashName}. Manual refund required — parked as refund_pending.`,
      "critical",
    );
  }
  await refreshOrderStatus(order.orderId);
}
