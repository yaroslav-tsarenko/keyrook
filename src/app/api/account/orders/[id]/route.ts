import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ORDER_VIEW_INCLUDE, orderView } from "@/lib/orders";
import { refreshOrdersFor } from "@/lib/sih/poll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const owned = await prisma.order.findFirst({ where: { id, userId: user.id }, select: { id: true, paymentStatus: true } });
  if (!owned) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  if (owned.paymentStatus === "PAID" && hasEnv("SIH_API_KEY") && consumeRateLimit("orderRefresh", user.id).allowed) {
    await refreshOrdersFor({ orderId: id }).catch(() => 0);
  }
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: ORDER_VIEW_INCLUDE });
  if (!order) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ order: orderView(order) });
}
