import { prisma } from "@/lib/prisma";
import { collectKeys, submitKeyOrder } from "./orders";

export interface PollResult {
  resubmitted: number;
  checked: number;
  delivered: number;
  durationMs: number;
}

const RESUBMIT_AFTER_MS = 2 * 60_000;
const LAZY_REFRESH_MS = 20_000;

export async function pollKeyOrders(): Promise<PollResult> {
  const t0 = Date.now();
  const stuckPaid = await prisma.keyOrder.findMany({
    where: { status: "paid", updatedAt: { lt: new Date(Date.now() - RESUBMIT_AFTER_MS) } },
    select: { id: true },
    take: 50,
  });
  for (const o of stuckPaid) await submitKeyOrder(o.id, "system");

  const inFlight = await prisma.keyOrder.findMany({
    where: { status: { in: ["submitted", "processing"] }, supplierOrderId: { not: null } },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: 200,
  });
  let delivered = 0;
  for (const o of inFlight) if ((await collectKeys(o.id, "supplier_poll")) === "delivered") delivered++;
  const result = { resubmitted: stuckPaid.length, checked: inFlight.length, delivered, durationMs: Date.now() - t0 };
  console.log(`[key-poll] resubmitted=${result.resubmitted} checked=${result.checked} delivered=${delivered} in ${result.durationMs}ms`);
  return result;
}

export async function refreshKeyOrdersFor(where: { userId?: string; orderId?: string }): Promise<number> {
  const now = Date.now();
  const candidates = await prisma.keyOrder.findMany({
    where: { ...where, status: { in: ["paid", "submitted", "processing"] } },
    select: { id: true, status: true, checkedAt: true, updatedAt: true },
    take: 20,
  });
  const due = candidates.filter((o) => !o.checkedAt || now - o.checkedAt.getTime() > LAZY_REFRESH_MS);
  for (const o of due) {
    if (o.status === "paid") {
      if (now - o.updatedAt.getTime() > RESUBMIT_AFTER_MS) await submitKeyOrder(o.id, "system");
      continue;
    }
    await collectKeys(o.id, "supplier_poll");
  }
  return due.length;
}
