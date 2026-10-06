import { NextResponse } from "next/server";
import { getWebhookProvider, PaymentUnavailableError, PaymentWebhookError, type PaymentEvent } from "@/lib/payments/provider";
import { settlePayment } from "@/lib/payment-settlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const provider = getWebhookProvider(id);
  if (!provider) return NextResponse.json({ code: "PROVIDER_NOT_CONFIGURED" }, { status: 404 });

  let claimed: PaymentEvent;
  try {
    claimed = await provider.parseWebhook(req);
  } catch (error) {
    if (error instanceof PaymentWebhookError) return NextResponse.json({ code: error.code }, { status: error.status });
    console.error(`[payment-webhook:${provider.id}] parse failed:`, error);
    return NextResponse.json({ code: "INVALID_WEBHOOK" }, { status: 400 });
  }

  let verified: PaymentEvent;
  try {
    verified = await provider.fetchStatus(claimed.providerRef);
  } catch (error) {
    if (error instanceof PaymentWebhookError) return NextResponse.json({ code: error.code }, { status: error.status });
    if (error instanceof PaymentUnavailableError) return NextResponse.json({ code: error.code }, { status: 503 });
    console.error(`[payment-webhook:${provider.id}] status re-check failed for ${claimed.providerRef}:`, error);
    return NextResponse.json({ code: "STATUS_UNAVAILABLE" }, { status: 502 });
  }
  if (verified.providerRef !== claimed.providerRef) {
    console.error(`[payment-webhook:${provider.id}] status re-check returned ${verified.providerRef} for ${claimed.providerRef}`);
    return NextResponse.json({ code: "REFERENCE_MISMATCH" }, { status: 409 });
  }
  if (claimed.orderId && verified.orderId && claimed.orderId !== verified.orderId) {
    console.error(`[payment-webhook:${provider.id}] order mismatch for ${claimed.providerRef}: ${claimed.orderId} vs ${verified.orderId}`);
    return NextResponse.json({ code: "REFERENCE_MISMATCH" }, { status: 409 });
  }

  try {
    const result = await settlePayment(provider.id, { ...verified, orderId: verified.orderId ?? claimed.orderId });
    return NextResponse.json({ received: true, status: verified.status, result });
  } catch (error) {
    console.error(`[payment-webhook:${provider.id}] settlement failed for ${claimed.providerRef}:`, error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
