import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env, hasEnv } from "@/lib/env";
import { esaClient, ordersAreLive } from "@/lib/esa/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const orderSelect = {
    id: true,
    quantity: true,
    shownPrice: true,
    costPrice: true,
    currency: true,
    status: true,
    supplierStatus: true,
    supplierError: true,
    supplierOrderId: true,
    createdAt: true,
    orderItem: { select: { productName: true } },
    order: { select: { id: true, orderNumber: true, customerEmail: true } },
    _count: { select: { keys: true } },
  } as const;

  const [grouped, backlog, recent, runs, active, byType] = await Promise.all([
    prisma.keyOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.keyOrder.findMany({ where: { status: { in: ["refund_pending", "failed"] }, paidAt: { not: null } }, orderBy: { updatedAt: "asc" }, take: 100, select: orderSelect }),
    prisma.keyOrder.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: orderSelect }),
    prisma.catalogSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.product.count({ where: { status: "ACTIVE", item: { isNot: null } } }),
    prisma.keyItem.groupBy({ by: ["productType"], where: { product: { status: "ACTIVE" } }, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.status] = g._count._all;

  let balance: number | null = null;
  let balanceError: string | null = null;
  if (hasEnv("KINGUIN_API_KEY")) {
    try {
      balance = await esaClient.getBalance();
    } catch (err) {
      balanceError = err instanceof Error ? err.message : "balance unavailable";
    }
  } else {
    balanceError = "Supplier API key is not set";
  }

  const row = (o: (typeof recent)[number]) => ({
    id: o.id,
    orderId: o.order.id,
    orderNumber: o.order.orderNumber,
    product: o.orderItem.productName,
    quantity: o.quantity,
    keys: o._count.keys,
    price: Number(o.shownPrice),
    cost: Number(o.costPrice),
    currency: o.currency,
    status: o.status,
    supplierStatus: o.supplierStatus,
    supplierOrderId: o.supplierOrderId,
    error: o.supplierError,
    email: o.order.customerEmail,
    createdAt: o.createdAt.toISOString(),
  });

  return NextResponse.json({
    live: hasEnv("KINGUIN_API_KEY") ? ordersAreLive() : false,
    balance,
    balanceError,
    lowBalanceThreshold: env.KINGUIN_LOW_BALANCE_THRESHOLD,
    counts,
    activeProducts: active,
    byType: Object.fromEntries(byType.map((t) => [t.productType, t._count._all])),
    runs: runs.map((r) => ({ ...r, startedAt: r.startedAt.toISOString(), finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null })),
    refundBacklog: backlog.map(row),
    recent: recent.map(row),
  });
}
