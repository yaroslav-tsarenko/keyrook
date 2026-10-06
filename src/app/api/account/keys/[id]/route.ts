import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { decryptKey } from "@/lib/keys/vault";
import { logKeyEvent } from "@/lib/esa/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401, headers: NO_STORE });
  const limited = rateLimitResponse(consumeRateLimit("keyReveal", user.id));
  if (limited) return limited;

  const { id } = await params;
  const key = await prisma.keyCode.findFirst({
    where: { id, userId: user.id, keyOrder: { status: "delivered", userId: user.id, order: { userId: user.id, paymentStatus: "PAID" } } },
    select: { id: true, secret: true, keyType: true, keyOrderId: true, revealedAt: true },
  });
  if (!key) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404, headers: NO_STORE });

  let value: string;
  try {
    value = decryptKey(key.secret, key.keyOrderId);
  } catch (err) {
    console.error(`[key-reveal] could not decrypt key ${key.id}: ${String(err)}`);
    return NextResponse.json({ code: "KEY_UNAVAILABLE" }, { status: 500, headers: NO_STORE });
  }
  const now = new Date();
  await prisma.keyCode.update({ where: { id: key.id }, data: { revealCount: { increment: 1 }, ...(key.revealedAt ? {} : { revealedAt: now }) } });
  if (!key.revealedAt) await logKeyEvent({ keyOrderId: key.keyOrderId, source: "customer", payload: { revealed: key.id } });
  return NextResponse.json({ key: value, type: key.keyType, revealedAt: (key.revealedAt ?? now).toISOString() }, { headers: NO_STORE });
}
