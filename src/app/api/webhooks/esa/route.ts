import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env, hasEnv } from "@/lib/env";
import { esaWebhookOrderSchema, esaWebhookProductSchema } from "@/lib/esa/types";
import { collectKeys } from "@/lib/esa/orders";
import { logKeyEvent } from "@/lib/esa/events";
import { applySupplyUpdate } from "@/lib/esa/refresh";
import { esaClient } from "@/lib/esa/client";
import { classifyProduct } from "@/lib/esa/classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  if (!hasEnv("KINGUIN_WEBHOOK_SECRET", "KINGUIN_API_KEY")) return NextResponse.json({ code: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  const secret = req.headers.get("x-event-secret") ?? "";
  if (!secret || !same(secret, env.KINGUIN_WEBHOOK_SECRET)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const event = (req.headers.get("x-event-name") ?? "").toLowerCase();
  const body = await req.json().catch(() => null);
  try {
    if (event === "order.status" || event === "order.complete") {
      const parsed = esaWebhookOrderSchema.safeParse(body);
      if (parsed.success) {
        const ref = parsed.data.orderExternalId ?? null;
        const local = await prisma.keyOrder.findFirst({ where: { OR: [{ supplierOrderId: parsed.data.orderId }, ...(ref ? [{ id: ref }] : [])] }, select: { id: true } });
        if (local) {
          await logKeyEvent({ keyOrderId: local.id, source: "supplier_webhook", payload: { status: parsed.data.status ?? null } });
          await collectKeys(local.id, "supplier_webhook");
        }
      }
    } else if (event === "product.update") {
      const parsed = esaWebhookProductSchema.safeParse(body);
      if (parsed.success) {
        const supply = await prisma.supplyItem.findUnique({ where: { esaId: parsed.data.kinguinId }, select: { productId: true, esaProductId: true } });
        if (supply) {
          const live = await esaClient.getProduct(supply.esaProductId).catch(() => null);
          const result = live ? classifyProduct(live) : null;
          await applySupplyUpdate(supply.productId, result && result.ok ? { cost: result.item.cost, qty: result.item.qty, offerId: result.item.offerId } : { cost: null, qty: 0 });
        }
      }
    }
  } catch (err) {
    console.error(`[esa-webhook] ${event} handler error: ${String(err)}`);
  }
  return new NextResponse(null, { status: 204 });
}
