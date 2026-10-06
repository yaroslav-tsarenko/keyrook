import type { KeyOrderStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendKeysReadyEmail, sendOrderStatusEmail } from "@/lib/email";
import { redeemTitle } from "@/lib/keys/taxonomy";
import type { StoredAddress } from "@/lib/orders";
import { IN_FLIGHT_STATUSES } from "./status";
import { round2 } from "./pricing";

export function deriveOrderStatus(statuses: KeyOrderStatus[]): { status: OrderStatus; refunded: boolean } | null {
  if (statuses.length === 0) return null;
  if (statuses.includes("awaiting_payment")) return null;
  if (statuses.every((s) => s === "refunded")) return { status: "REFUNDED", refunded: true };
  if (statuses.some((s) => IN_FLIGHT_STATUSES.includes(s))) return { status: "PROCESSING", refunded: false };
  if (statuses.some((s) => s === "delivered")) return { status: "DELIVERED", refunded: false };
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
    shippingMethod: order.shippingMethod || "digital_key",
    shippingAddress: (order.shippingAddress ?? undefined) as StoredAddress | undefined,
    billingAddress: (order.billingAddress ?? null) as StoredAddress | null,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    waiverText: order.waiverText,
    waiverAcceptedAt: order.waiverAcceptedAt,
  };
}

async function notifyKeysReady(orderId: string): Promise<void> {
  const full = await loadOrderForEmail(orderId);
  if (!full) return;
  const delivered = await prisma.keyOrder.findMany({
    where: { orderId, status: "delivered" },
    select: { orderItem: { select: { productName: true } }, _count: { select: { keys: true } }, productId: true },
  });
  if (delivered.length === 0) return;
  const platforms = await prisma.keyItem.findMany({ where: { productId: { in: delivered.map((d) => d.productId) } }, select: { productId: true, platform: true } });
  const platformOf = new Map(platforms.map((p) => [p.productId, redeemTitle(p.platform)]));
  const items = delivered.map((d) => ({ name: d.orderItem.productName, keys: d._count.keys, platform: platformOf.get(d.productId) ?? null }));
  scheduleEmail(`keys ready ${full.orderNumber}`, () => sendKeysReadyEmail(orderEmailPayload(full), items));
}

export async function refreshOrderStatus(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, paymentStatus: true, keyOrders: { select: { status: true } } },
  });
  if (!order || (order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED")) return;
  const next = deriveOrderStatus(order.keyOrders.map((s) => s.status));
  if (!next || next.status === order.status) return;

  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { status: next.status, ...(next.refunded ? { paymentStatus: "REFUNDED" as const } : {}) },
  });
  if (claim.count === 0) return;

  if (next.status === "DELIVERED") await notifyKeysReady(orderId);
  if (next.status === "REFUNDED") {
    const full = await loadOrderForEmail(orderId);
    if (full) scheduleEmail(`order refunded ${full.orderNumber}`, () => sendOrderStatusEmail(orderEmailPayload(full), "REFUNDED"));
  }
}

export async function notifyItemRefunded(keyOrderId: string): Promise<void> {
  const row = await prisma.keyOrder.findUnique({ where: { id: keyOrderId }, select: { orderId: true, orderItemId: true, order: { select: { keyOrders: { select: { status: true } } } } } });
  if (!row || row.order.keyOrders.every((s) => s.status === "refunded")) return;
  const full = await loadOrderForEmail(row.orderId);
  if (!full) return;
  const index = full.items.findIndex((i) => i.id === row.orderItemId);
  if (index === -1 || full.items.length === 1) return;
  const rate = Number(full.exchangeRate) || 1;
  const item = full.items[index];
  const amount = round2(Number(item.price) * item.quantity * rate);
  scheduleEmail(`item refund ${keyOrderId}`, () => sendOrderStatusEmail(orderEmailPayload(full), "REFUNDED", amount));
}
