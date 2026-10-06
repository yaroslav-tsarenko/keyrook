import type { PaymentProviderId } from "@/lib/env";

export type { PaymentProviderId };

export const PAYMENT_METHOD_LABEL = "Card payment (Visa or Mastercard) on the secure payment page";

export type PaymentEventStatus = "paid" | "failed" | "pending";

export interface PaymentOrderRef {
  id: string;
  number: string;
  description: string;
}

export interface PaymentCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  ip: string;
  billing: {
    address1: string;
    address2: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface CreatePaymentInput {
  order: PaymentOrderRef;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  customer: PaymentCustomer;
}

export interface CreatePaymentResult {
  redirectUrl: string;
  providerRef: string;
}

export interface PaymentEvent {
  providerRef: string;
  orderId: string | null;
  status: PaymentEventStatus;
  amount: number | null;
  currency: string | null;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly available: boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  parseWebhook(request: Request): Promise<PaymentEvent>;
  fetchStatus(providerRef: string): Promise<PaymentEvent>;
}

export class PaymentUnavailableError extends Error {
  readonly code = "PAYMENTS_NOT_CONNECTED";

  constructor(public provider: PaymentProviderId) {
    super(`Payment provider "${provider}" cannot take payments`);
  }
}

export class PaymentWebhookError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
