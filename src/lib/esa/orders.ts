import type { KeyOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { catalogConfig } from "@/config/catalog";
import { sendAlert } from "@/lib/alerts/telegram";
import { encryptKey, keyFingerprint } from "@/lib/keys/vault";
import { esaClient, ordersAreLive } from "./client";
import { EsaError, type EsaErrorCode } from "./errors";
import { logKeyEvent, type KeyEventSource } from "./events";
import { refreshOrderStatus } from "./order-status";
import { mapSupplierStatus } from "./status";
import { round2 } from "./pricing";

const MAX_ATTEMPTS = 3;
const TRANSIENT: EsaErrorCode[] = ["network", "timeout", "bad_response", "rate_limited"];

async function transition(id: string, from: KeyOrderStatus | KeyOrderStatus[], to: KeyOrderStatus, source: KeyEventSource, data: Record<string, unknown> = {}, payload?: unknown): Promise<boolean> {
  const fromList = Array.isArray(from) ? from : [from];
  const claim = await prisma.keyOrder.updateMany({ where: { id, status: { in: fromList } }, data: { status: to, ...data } });
  if (claim.count === 0) return false;
  await logKeyEvent({ keyOrderId: id, source, fromStatus: fromList.length === 1 ? fromList[0] : null, toStatus: to, payload });
  return true;
}

async function parkForRefund(id: string, from: KeyOrderStatus[], reason: string, source: KeyEventSource): Promise<void> {
  const row = await prisma.keyOrder.findUnique({ where: { id }, select: { orderItem: { select: { productName: true } }, quantity: true } });
  const moved = await transition(id, from, "refund_pending", source, { supplierError: reason.slice(0, 300) }, { reason });
  if (!moved) return;
  await sendAlert(`Key order <b>${id}</b> (${row?.orderItem.productName ?? "?"} ×${row?.quantity ?? "?"}) could not be fulfilled after payment: ${reason}. Parked as refund_pending — refund or retry from admin.`, "critical");
}

export async function storeKeys(keyOrderId: string, serials: { serial: string; type: string }[]): Promise<number> {
  const order = await prisma.keyOrder.findUnique({ where: { id: keyOrderId }, select: { id: true, orderId: true, userId: true } });
  if (!order) return 0;
  const rows = serials
    .map(({ serial, type }) => ({ plain: serial.trim(), type }))
    .filter((k) => k.plain)
    .map((k) => ({
      keyOrderId,
      orderId: order.orderId,
      userId: order.userId,
      secret: encryptKey(k.plain, keyOrderId),
      fingerprint: keyFingerprint(k.plain),
      keyType: k.type.startsWith("image") ? "image" : "text",
    }));
  if (rows.length === 0) return 0;
  const result = await prisma.keyCode.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

export async function collectKeys(keyOrderId: string, source: KeyEventSource = "supplier_poll"): Promise<KeyOrderStatus | null> {
  const row = await prisma.keyOrder.findUnique({ where: { id: keyOrderId }, select: { id: true, status: true, supplierOrderId: true, quantity: true, orderId: true, _count: { select: { keys: true } } } });
  if (!row || !row.supplierOrderId) return row?.status ?? null;
  if (row.status !== "submitted" && row.status !== "processing") return row.status;

  await prisma.keyOrder.update({ where: { id: keyOrderId }, data: { checkedAt: new Date() } });
  let remote;
  try {
    remote = await esaClient.getOrder(row.supplierOrderId);
  } catch (err) {
    console.error(`[key-order] status check for ${keyOrderId} failed: ${String(err)}`);
    return row.status;
  }
  const mapped = mapSupplierStatus(remote.status);
  if (remote.status !== undefined) await prisma.keyOrder.update({ where: { id: keyOrderId }, data: { supplierStatus: remote.status } });

  if (mapped === "canceled" || mapped === "refunded") {
    await parkForRefund(keyOrderId, ["submitted", "processing"], `supplier order ${remote.status}`, source);
    await refreshOrderStatus(row.orderId);
    return "refund_pending";
  }
  if (row.status === "submitted") await transition(keyOrderId, "submitted", "processing", source, {}, { supplierStatus: remote.status });
  if (mapped !== "completed") return "processing";

  let keys;
  try {
    keys = await esaClient.getKeys(row.supplierOrderId);
  } catch (err) {
    console.error(`[key-order] key fetch for ${keyOrderId} failed: ${String(err)}`);
    return "processing";
  }
  await storeKeys(keyOrderId, keys.map((k) => ({ serial: k.serial, type: k.type })));
  const count = await prisma.keyCode.count({ where: { keyOrderId } });
  if (count >= row.quantity) {
    await transition(keyOrderId, ["processing", "submitted"], "delivered", source, { deliveredAt: new Date(), supplierError: null }, { keys: count });
    await refreshOrderStatus(row.orderId);
    return "delivered";
  }
  await logKeyEvent({ keyOrderId, source, payload: { note: "completed with fewer keys than ordered", keys: count, quantity: row.quantity } });
  return "processing";
}

export async function submitKeyOrder(keyOrderId: string, source: KeyEventSource = "payment"): Promise<void> {
  const claimed = await transition(keyOrderId, "paid", "submitted", source, { submittedAt: new Date(), attempts: { increment: 1 } });
  if (!claimed) return;
  const order = await prisma.keyOrder.findUnique({ where: { id: keyOrderId } });
  if (!order) return;

  try {
    let supplierOrderId = order.supplierOrderId;
    if (!supplierOrderId) {
      const existing = await esaClient.findOrderByExternalId(order.id).catch(() => null);
      if (existing) supplierOrderId = existing.orderId;
    }
    if (!supplierOrderId) {
      const maxPrice = round2(Number(order.costPrice) * (1 + catalogConfig.pricing.orderPriceTolerance));
      const created = await esaClient.createOrder({
        orderExternalId: order.id,
        products: [{ productId: order.esaProductId, qty: order.quantity, price: maxPrice }],
      });
      supplierOrderId = created.orderId;
    }
    await prisma.keyOrder.update({ where: { id: keyOrderId }, data: { supplierOrderId, supplierError: null } });
    await logKeyEvent({ keyOrderId, source: "system", payload: { supplierOrderId, live: ordersAreLive() } });
    await collectKeys(keyOrderId, "system");
  } catch (err) {
    const code: EsaErrorCode = err instanceof EsaError ? err.code : "unknown";
    const fresh = await prisma.keyOrder.findUnique({ where: { id: keyOrderId }, select: { attempts: true } });
    if (TRANSIENT.includes(code) && (fresh?.attempts ?? MAX_ATTEMPTS) < MAX_ATTEMPTS) {
      await transition(keyOrderId, "submitted", "paid", "system", { supplierError: code }, { error: code, retry: true });
      await sendAlert(`Key order <b>${keyOrderId}</b>: supplier call failed (${code}). It will be retried by the poll job.`, "warn");
    } else {
      await parkForRefund(keyOrderId, ["submitted"], code === "insufficient_balance" ? "supplier balance too low" : code, "system");
    }
  }
  await refreshOrderStatus(order.orderId);
}

export async function retryKeyOrder(keyOrderId: string): Promise<boolean> {
  const moved = await transition(keyOrderId, ["refund_pending", "failed"], "paid", "admin", { attempts: 0, supplierError: null });
  if (moved) await submitKeyOrder(keyOrderId, "admin");
  return moved;
}

export async function markKeyOrderRefunded(keyOrderId: string): Promise<boolean> {
  return transition(keyOrderId, ["refund_pending", "failed", "paid"], "refunded", "admin", { refundedAt: new Date() });
}
