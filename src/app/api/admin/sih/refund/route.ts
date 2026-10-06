import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSihEvent } from "@/lib/sih/orders";
import { notifyItemRefunded, refreshOrderStatus } from "@/lib/sih/order-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const current = await prisma.sihOrder.findUnique({ where: { id: parsed.data.orderId }, select: { status: true, orderId: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const claim = await prisma.sihOrder.updateMany({
    where: { id: parsed.data.orderId, status: { in: ["refund_pending", "rolled_back"] } },
    data: { status: "refunded", refundedAt: new Date() },
  });
  if (claim.count === 0) return NextResponse.json({ ok: true, status: current.status, changed: false });

  await logSihEvent({
    orderId: parsed.data.orderId,
    source: "system",
    fromStatus: current.status,
    toStatus: "refunded",
    payload: { reason: "manual_refund", by: admin.email ?? admin.id },
  });
  await notifyItemRefunded(parsed.data.orderId);
  await refreshOrderStatus(current.orderId);
  return NextResponse.json({ ok: true, status: "refunded", changed: true });
}
