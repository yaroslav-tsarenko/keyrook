import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mockPaymentsAllowed } from "@/lib/env";
import { PaymentUnavailableError, PaymentWebhookError, type CreatePaymentInput, type PaymentEvent, type PaymentEventStatus, type PaymentProvider } from "./types";

export const MOCK_SIGNATURE_HEADER = "x-mock-signature";

export interface MockPayment {
  providerRef: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: PaymentEventStatus;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  createdAt: number;
}

const globalForMock = globalThis as unknown as { mockPayments?: Map<string, MockPayment> };
const payments = (globalForMock.mockPayments ??= new Map<string, MockPayment>());

function assertAllowed() {
  if (!mockPaymentsAllowed()) throw new PaymentUnavailableError("mock");
}

function signingKey(): Buffer {
  return createHmac("sha256", process.env.JWT_SECRET || "dev-secret-change-in-production").update("payment-mock-webhook").digest();
}

export function signMockWebhook(rawBody: string): string {
  return createHmac("sha256", signingKey()).update(rawBody).digest("hex");
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const a = Buffer.from(signature.trim());
  const b = Buffer.from(signMockWebhook(rawBody));
  return a.length === b.length && timingSafeEqual(a, b);
}

function toEvent(payment: MockPayment): PaymentEvent {
  return { providerRef: payment.providerRef, orderId: payment.orderId, status: payment.status, amount: payment.amount, currency: payment.currency };
}

export function getMockPayment(providerRef: string): MockPayment | null {
  if (!mockPaymentsAllowed()) return null;
  return payments.get(providerRef) ?? null;
}

export async function completeMockPayment(providerRef: string, outcome: "paid" | "failed"): Promise<{ redirectUrl: string; delivered: boolean }> {
  assertAllowed();
  const payment = payments.get(providerRef);
  if (!payment) throw new PaymentWebhookError("UNKNOWN_PAYMENT", 404);
  if (payment.status === "pending") payment.status = outcome;

  const body = JSON.stringify({ ref: payment.providerRef, status: payment.status, sentAt: new Date().toISOString() });
  let delivered = false;
  try {
    const res = await fetch(payment.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", [MOCK_SIGNATURE_HEADER]: signMockWebhook(body) },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    delivered = res.ok;
    if (!res.ok) console.error(`[mock-payment] webhook for ${providerRef} answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    console.error(`[mock-payment] webhook for ${providerRef} failed: ${String(err)}`);
  }
  return { redirectUrl: payment.status === "paid" ? payment.returnUrl : payment.cancelUrl, delivered };
}

export const mockProvider: PaymentProvider = {
  id: "mock",
  get available() {
    return mockPaymentsAllowed();
  },

  async createPayment(input: CreatePaymentInput) {
    assertAllowed();
    const providerRef = `mock_${randomUUID()}`;
    payments.set(providerRef, {
      providerRef,
      orderId: input.order.id,
      orderNumber: input.order.number,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      status: "pending",
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      webhookUrl: input.webhookUrl,
      createdAt: Date.now(),
    });
    const redirectUrl = new URL(`/checkout/mock-pay?ref=${encodeURIComponent(providerRef)}`, input.returnUrl).toString();
    return { redirectUrl, providerRef };
  },

  async parseWebhook(request: Request) {
    if (!mockPaymentsAllowed()) throw new PaymentWebhookError("PROVIDER_NOT_CONFIGURED", 404);
    const rawBody = await request.text();
    if (!verifySignature(rawBody, request.headers.get(MOCK_SIGNATURE_HEADER))) throw new PaymentWebhookError("INVALID_SIGNATURE", 401);
    let payload: { ref?: unknown; status?: unknown };
    try {
      payload = JSON.parse(rawBody) as { ref?: unknown; status?: unknown };
    } catch {
      throw new PaymentWebhookError("INVALID_JSON", 400);
    }
    if (typeof payload.ref !== "string" || !payload.ref) throw new PaymentWebhookError("MISSING_REFERENCE", 400);
    const status: PaymentEventStatus = payload.status === "paid" || payload.status === "failed" ? payload.status : "pending";
    return { providerRef: payload.ref, orderId: null, status, amount: null, currency: null };
  },

  async fetchStatus(providerRef: string) {
    assertAllowed();
    const payment = payments.get(providerRef);
    if (!payment) throw new PaymentWebhookError("UNKNOWN_PAYMENT", 404);
    return toEvent(payment);
  },
};
