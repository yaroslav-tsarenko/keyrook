import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryKeyOrder } from "@/lib/esa/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({ keyOrderId: z.string().min(1) });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const moved = await retryKeyOrder(parsed.data.keyOrderId);
  const after = await prisma.keyOrder.findUnique({ where: { id: parsed.data.keyOrderId }, select: { status: true } });
  return NextResponse.json({ ok: moved, status: after?.status ?? null });
}
