import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markKeyOrderRefunded } from "@/lib/esa/orders";
import { notifyItemRefunded, refreshOrderStatus } from "@/lib/esa/order-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ keyOrderId: z.string().min(1) });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const current = await prisma.keyOrder.findUnique({ where: { id: parsed.data.keyOrderId }, select: { status: true, orderId: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const changed = await markKeyOrderRefunded(parsed.data.keyOrderId);
  if (!changed) return NextResponse.json({ ok: true, status: current.status, changed: false });
  await notifyItemRefunded(parsed.data.keyOrderId);
  await refreshOrderStatus(current.orderId);
  return NextResponse.json({ ok: true, status: "refunded", changed: true });
}
