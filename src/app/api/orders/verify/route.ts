import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORDER_VIEW_INCLUDE, orderView } from "@/lib/orders";
import { refreshOrdersFor } from "@/lib/sih/poll";
import { hasEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("order");
    if (!id) return NextResponse.json({ code: "MISSING_REFERENCE" }, { status: 400 });

    const exists = await prisma.order.findFirst({ where: { id, userId: user.id }, select: { id: true, paymentStatus: true } });
    if (!exists) return NextResponse.json({ code: "ORDER_NOT_FOUND" }, { status: 404 });
    if (exists.paymentStatus === "PAID" && hasEnv("SIH_API_KEY")) await refreshOrdersFor({ orderId: id }).catch(() => 0);

    const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: ORDER_VIEW_INCLUDE });
    if (!order) return NextResponse.json({ code: "ORDER_NOT_FOUND" }, { status: 404 });
    const verification = order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED" ? "confirmed" : order.paymentStatus === "FAILED" ? "failed" : order.notes?.includes("Held for review") ? "review" : "pending";
    return NextResponse.json({ verification, order: orderView(order) });
  } catch (error) {
    console.error("Error verifying order payment:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
