import { prisma } from "@/lib/prisma";
import { sihClient } from "./client";
import { IN_FLIGHT_STATUSES } from "./status";
import { applySihOrderObject } from "./orders";
import { finalizeSihOrder } from "./finalize";
import { submitOrderToSih } from "./checkout";

export interface PollResult {
  polled: number;
  updated: number;
  resubmitted: number;
  durationMs: number;
}

const BATCH = 100;

export async function pollInFlightOrders(): Promise<PollResult> {
  const t0 = Date.now();

  const stuckPaid = await prisma.sihOrder.findMany({
    where: { status: "paid" },
    select: { id: true },
    take: BATCH,
  });
  let resubmitted = 0;
  for (const o of stuckPaid) {
    await submitOrderToSih(o.id);
    resubmitted++;
  }

  const inFlight = await prisma.sihOrder.findMany({
    where: { status: { in: IN_FLIGHT_STATUSES } },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: 500,
  });

  let updated = 0;
  for (let i = 0; i < inFlight.length; i += BATCH) {
    const chunk = inFlight.slice(i, i + BATCH);
    const customIds = chunk.map((o) => o.id);
    let orders;
    try {
      orders = await sihClient.getOrders({ customIds });
    } catch (err) {
      console.error(`[sih-poll] getOrders failed: ${String(err)}`);
      continue;
    }
    const byCustom = new Map<string, (typeof orders)[number]>();
    for (const o of orders) {
      if (o.customId != null) byCustom.set(String(o.customId), o);
    }
    for (const o of chunk) {
      const fresh = byCustom.get(o.id);
      if (!fresh) continue;
      await applySihOrderObject(o.id, fresh, "sih_poll");
      await finalizeSihOrder(o.id);
      updated++;
    }
  }

  const result: PollResult = {
    polled: inFlight.length,
    updated,
    resubmitted,
    durationMs: Date.now() - t0,
  };
  console.log(
    `[sih-poll] polled=${result.polled} updated=${result.updated} ` +
      `resubmitted=${result.resubmitted} in ${result.durationMs}ms`,
  );
  return result;
}

const LAZY_REFRESH_MS = 45_000;
const LAZY_RESUBMIT_MS = 2 * 60_000;

export async function refreshOrdersFor(where: { userId?: string; orderId?: string }): Promise<number> {
  const now = Date.now();
  const candidates = await prisma.sihOrder.findMany({
    where: { ...where, status: { in: ["paid", ...IN_FLIGHT_STATUSES] } },
    select: { id: true, status: true, checkedAt: true, updatedAt: true },
    take: 20,
  });
  const due = candidates.filter((o) => !o.checkedAt || now - o.checkedAt.getTime() > LAZY_REFRESH_MS);
  if (due.length === 0) return 0;
  await prisma.sihOrder.updateMany({ where: { id: { in: due.map((o) => o.id) } }, data: { checkedAt: new Date(now) } });

  for (const o of due) {
    if (o.status === "paid" && now - o.updatedAt.getTime() > LAZY_RESUBMIT_MS) await submitOrderToSih(o.id);
  }
  const inFlight = due.filter((o) => o.status !== "paid");
  if (inFlight.length === 0) return due.length;
  try {
    const fresh = await sihClient.getOrders({ customIds: inFlight.map((o) => o.id) });
    for (const remote of fresh) {
      if (remote.customId == null) continue;
      const id = String(remote.customId);
      if (!inFlight.some((o) => o.id === id)) continue;
      await applySihOrderObject(id, remote, "sih_poll");
      await finalizeSihOrder(id);
    }
  } catch (err) {
    console.error(`[sih-refresh] getOrders failed: ${String(err)}`);
  }
  return due.length;
}
