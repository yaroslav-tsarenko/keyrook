import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env, hasEnv } from "@/lib/env";
import { sihClient } from "@/lib/sih/client";
import { sihImageUrl } from "@/lib/sih/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [grouped, backlog, recent, runs, catalog] = await Promise.all([
    prisma.sihOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.sihOrder.findMany({
      where: { status: { in: ["refund_pending", "rolled_back"] } },
      orderBy: { updatedAt: "asc" },
      take: 100,
      select: {
        id: true,
        marketHashName: true,
        shownPrice: true,
        currency: true,
        status: true,
        sihError: true,
        createdAt: true,
        order: { select: { id: true, orderNumber: true, customerEmail: true } },
      },
    }),
    prisma.sihOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        marketHashName: true,
        shownPrice: true,
        costPrice: true,
        currency: true,
        status: true,
        sihStatus: true,
        createdAt: true,
        order: { select: { id: true, orderNumber: true, customerEmail: true } },
        item: { select: { imageHash: true } },
      },
    }),
    prisma.catalogSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.product.count({ where: { status: "ACTIVE", skin: { isNot: null } } }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.status] = g._count._all;

  let balance: number | null = null;
  let balanceError: string | null = null;
  if (hasEnv("SIH_API_KEY")) {
    try {
      balance = (await sihClient.getProject()).balance;
    } catch (err) {
      balanceError = err instanceof Error ? err.message : "balance unavailable";
    }
  } else {
    balanceError = "SIH_API_KEY is not set";
  }

  return NextResponse.json({
    balance,
    balanceError,
    lowBalanceThreshold: env.SIH_LOW_BALANCE_THRESHOLD,
    counts,
    activeProducts: catalog,
    runs: runs.map((r) => ({ ...r, startedAt: r.startedAt.toISOString(), finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null })),
    refundBacklog: backlog.map((o) => ({
      id: o.id,
      orderId: o.order.id,
      orderNumber: o.order.orderNumber,
      marketHashName: o.marketHashName,
      price: Number(o.shownPrice),
      currency: o.currency,
      status: o.status,
      error: o.sihError,
      email: o.order.customerEmail,
      createdAt: o.createdAt.toISOString(),
    })),
    recent: recent.map((o) => ({
      id: o.id,
      orderId: o.order.id,
      orderNumber: o.order.orderNumber,
      marketHashName: o.marketHashName,
      price: Number(o.shownPrice),
      cost: Number(o.costPrice),
      currency: o.currency,
      status: o.status,
      sihStatus: o.sihStatus,
      email: o.order.customerEmail,
      imageUrl: sihImageUrl(o.item?.imageHash),
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
