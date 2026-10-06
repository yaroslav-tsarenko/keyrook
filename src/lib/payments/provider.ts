import { env, type PaymentProviderId } from "@/lib/env";
import { noneProvider } from "./none";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export * from "./types";

const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  none: noneProvider,
  mock: mockProvider,
};

export function getPaymentProvider(): PaymentProvider {
  return PROVIDERS[env.PAYMENT_PROVIDER];
}

export function getWebhookProvider(id: string): PaymentProvider | null {
  const active = getPaymentProvider();
  return active.id === id && active.id !== "none" ? active : null;
}
