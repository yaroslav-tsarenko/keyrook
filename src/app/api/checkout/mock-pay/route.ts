import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getPaymentProvider, PaymentWebhookError } from "@/lib/payments/provider";
import { completeMockPayment, getMockPayment } from "@/lib/payments/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ ref: z.string().min(1).max(200), outcome: z.enum(["paid", "failed"]) });

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || getPaymentProvider().id !== "mock") {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  const payment = getMockPayment(parsed.data.ref);
  if (!payment) return NextResponse.json({ code: "UNKNOWN_PAYMENT" }, { status: 404 });
  const owned = await prisma.order.findFirst({ where: { id: payment.orderId, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ code: "UNKNOWN_PAYMENT" }, { status: 404 });

  try {
    const result = await completeMockPayment(payment.providerRef, parsed.data.outcome);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentWebhookError) return NextResponse.json({ code: error.code }, { status: error.status });
    console.error("[mock-pay] failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
