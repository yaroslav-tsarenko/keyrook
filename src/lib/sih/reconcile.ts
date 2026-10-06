import { prisma } from "@/lib/prisma";
import { sendAlert } from "@/lib/alerts/telegram";
import { sihClient } from "./client";
import { applySihOrderObject } from "./orders";
import { finalizeSihOrder } from "./finalize";

export interface ReconcileResult {
  scanned: number;
  reconciled: number;
  changed: number;
  walletEntries: number;
  durationMs: number;
}

const BATCH = 100;

const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;

export async function reconcileSihOrders(): Promise<ReconcileResult> {
  const t0 = Date.now();
  const since = new Date(Date.now() - LOOKBACK_MS);

  const orders = await prisma.sihOrder.findMany({
    where: {
      createdAt: { gte: since },
      sihOrderId: { not: null },
    },
    select: { id: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  let reconciled = 0;
  let changed = 0;
  for (let i = 0; i < orders.length; i += BATCH) {
    const chunk = orders.slice(i, i + BATCH);
    const customIds = chunk.map((o) => o.id);
    let fresh;
    try {
      fresh = await sihClient.getOrders({ customIds });
    } catch (err) {
      console.error(`[sih-reconcile] getOrders failed: ${String(err)}`);
      continue;
    }
    const byCustom = new Map<string, (typeof fresh)[number]>();
    for (const o of fresh) {
      if (o.customId != null) byCustom.set(String(o.customId), o);
    }
    for (const o of chunk) {
      const remote = byCustom.get(o.id);
      if (!remote) continue;
      await applySihOrderObject(o.id, remote, "sih_reconcile");
      await finalizeSihOrder(o.id);
      reconciled++;
      const after = await prisma.sihOrder.findUnique({
        where: { id: o.id },
        select: { status: true },
      });
      if (after && after.status !== o.status) changed++;
    }
  }

  let walletEntries = 0;
  try {
    const wallet = await sihClient.getWalletHistory({ limit: 100 });
    walletEntries = wallet.history.length;
  } catch (err) {
    await sendAlert(`SIH wallet history fetch failed during reconcile: ${String(err)}`, "info");
  }

  if (changed > 0) {
    await sendAlert(
      `SIH daily reconcile updated <b>${changed}</b> order(s) that had drifted from ` +
        `the supplier's state. Review recent orders.`,
      "warn",
    );
  }

  const result: ReconcileResult = {
    scanned: orders.length,
    reconciled,
    changed,
    walletEntries,
    durationMs: Date.now() - t0,
  };
  console.log(
    `[sih-reconcile] scanned=${result.scanned} reconciled=${result.reconciled} ` +
      `changed=${result.changed} walletEntries=${result.walletEntries} in ${result.durationMs}ms`,
  );
  return result;
}
