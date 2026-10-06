import type { OrderStatus, SihOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderStatusEmail, sendTradeOfferEmail } from "@/lib/email";
import type { StoredAddress } from "@/lib/orders";
import { round2 } from "./pricing";

const IN_FLIGHT: SihOrderStatus[] = ["paid", "submitted", "processing", "sent"];

export function deriveOrderStatus(statuses: SihOrderStatus[]): { status: OrderStatus; refunded: boolean } | null {
  if (statuses.length === 0) return null;
  if (statuses.includes("awaiting_payment")) return null;
  if (statuses.every((s) => s === "refunded")) return { status: "REFUNDED", refunded: true };
  if (statuses.every((s) => s === "finished" || s === "refunded")) return { status: "DELIVERED", refunded: false };
  if (statuses.some((s) => IN_FLIGHT.includes(s))) return { status: "PROCESSING", refunded: false };
  return { status: "PROCESSING", refunded: false };
}

export async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

export type EmailOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>;

export function orderEmailPayload(order: EmailOrder) {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingCost: order.shippingCost,
    discountAmount: order.discountAmount,
    discountPercent: order.discountPercent,
    total: order.total,
    currency: order.currency,
    exchangeRate: order.exchangeRate,
    shippingMethod: order.shippingMethod || "steam_trade",
    shippingAddress: (order.shippingAddress ?? undefined) as StoredAddress | undefined,
    billingAddress: (order.billingAddress ?? null) as StoredAddress | null,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    steamId: order.steamId,
    waiverText: order.waiverText,
    waiverAcceptedAt: order.waiverAcceptedAt,
  };
}

export async function refreshOrderStatus(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, paymentStatus: true, sihOrders: { select: { status: true } } },
  });
  if (!order || (order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED")) return;
  const next = deriveOrderStatus(order.sihOrders.map((s) => s.status));
  if (!next || next.status === order.status) return;

  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { status: next.status, ...(next.refunded ? { paymentStatus: "REFUNDED" as const } : {}) },
  });
  if (claim.count === 0) return;

  if (next.status === "DELIVERED" || next.status === "REFUNDED") {
    const full = await loadOrderForEmail(orderId);
    if (full) {
      const status = next.status;
      scheduleEmail(`order ${status.toLowerCase()} ${full.orderNumber}`, () => sendOrderStatusEmail(orderEmailPayload(full), status));
    }
  }
}

export async function notifyTradeOfferSent(sihOrderId: string): Promise<void> {
  const sih = await prisma.sihOrder.findUnique({
    where: { id: sihOrderId },
    select: { orderId: true, senderTimeout: true, orderItem: { select: { productName: true } } },
  });
  if (!sih) return;
  const full = await loadOrderForEmail(sih.orderId);
  if (!full) return;
  scheduleEmail(`trade offer ${sihOrderId}`, () => sendTradeOfferEmail(orderEmailPayload(full), { name: sih.orderItem.productName, expiresAt: sih.senderTimeout }));
}

export async function notifyItemRefunded(sihOrderId: string): Promise<void> {
  const sih = await prisma.sihOrder.findUnique({ where: { id: sihOrderId }, select: { orderId: true, orderItemId: true, order: { select: { sihOrders: { select: { status: true } } } } } });
  if (!sih || sih.order.sihOrders.every((s) => s.status === "refunded")) return;
  const full = await loadOrderForEmail(sih.orderId);
  if (!full) return;
  const index = full.items.findIndex((i) => i.id === sih.orderItemId);
  if (index === -1 || full.items.length === 1) return;
  const rate = Number(full.exchangeRate) || 1;
  const amount = round2(Number(full.items[index].price) * rate);
  scheduleEmail(`item refund ${sihOrderId}`, () => sendOrderStatusEmail(orderEmailPayload(full), "REFUNDED", amount));
}
