import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env, hasEnv } from "@/lib/env";
import { sihClient } from "@/lib/sih/client";
import { sihOrderObjectSchema } from "@/lib/sih/types";
import { applySihOrderObject, logSihEvent } from "@/lib/sih/orders";
import { finalizeSihOrder } from "@/lib/sih/finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(req: Request, rawBody: string): boolean {
  const secret = env.SIH_WEBHOOK_SECRET;
  const fromQuery = new URL(req.url).searchParams.get("secret");
  if (fromQuery && same(fromQuery, secret)) return true;
  const sig = req.headers.get("x-signature") || req.headers.get("signature");
  if (!sig) return false;
  return same(sig, createHmac("sha256", secret).update(rawBody).digest("hex"));
}

function extractRefs(body: unknown): { id?: string; customId?: string } {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  const order = (o.order && typeof o.order === "object" ? o.order : o) as Record<string, unknown>;
  const id = order.id ?? o.id ?? o.orderId;
  const customId = order.customId ?? o.customId ?? o.custom_id;
  return {
    id: id != null ? String(id) : undefined,
    customId: customId != null ? String(customId) : undefined,
  };
}

export async function POST(req: Request) {
  if (!hasEnv("SIH_WEBHOOK_SECRET")) return NextResponse.json({ code: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  const rawBody = await req.text();
  if (!authorized(req, rawBody)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown = undefined;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ ok: true });
  }

  const { id, customId } = extractRefs(body);
  try {
    let localOrderId = customId ?? null;
    if (localOrderId && !(await prisma.sihOrder.findUnique({ where: { id: localOrderId }, select: { id: true } }))) localOrderId = null;
    if (!localOrderId && id) {
      const found = await prisma.sihOrder.findFirst({ where: { sihOrderId: id }, select: { id: true } });
      localOrderId = found?.id ?? null;
    }
    if (!localOrderId) {
      console.warn(`[sih-webhook] unmatched order id=${id} customId=${customId}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    const fresh =
      (await sihClient.getOrder({ customId: localOrderId }).catch(() => null)) ??
      (id ? await sihClient.getOrder({ id }).catch(() => null) : null);

    if (fresh) {
      await applySihOrderObject(localOrderId, fresh, "sih_webhook");
      await finalizeSihOrder(localOrderId);
    } else {
      const parsed = sihOrderObjectSchema.safeParse((body as Record<string, unknown>).order ?? body);
      if (parsed.success) {
        await applySihOrderObject(localOrderId, parsed.data, "sih_webhook");
        await finalizeSihOrder(localOrderId);
      } else {
        await logSihEvent({ orderId: localOrderId, source: "sih_webhook", payload: { note: "re-fetch failed, body unparsable", body } });
      }
    }
  } catch (err) {
    console.error(`[sih-webhook] handler error: ${String(err)}`);
  }
  return NextResponse.json({ ok: true });
}
