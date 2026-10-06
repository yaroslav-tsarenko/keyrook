import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hasEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ORDER_VIEW_INCLUDE, orderView } from "@/lib/orders";
import { refreshOrdersFor } from "@/lib/sih/poll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  if (hasEnv("SIH_API_KEY") && consumeRateLimit("orderRefresh", user.id).allowed) await refreshOrdersFor({ userId: user.id }).catch(() => 0);
  const orders = await prisma.order.findMany({
    where: { userId: user.id, NOT: { paymentStatus: "FAILED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: ORDER_VIEW_INCLUDE,
  });
  return NextResponse.json({ orders: orders.map(orderView) });
}
