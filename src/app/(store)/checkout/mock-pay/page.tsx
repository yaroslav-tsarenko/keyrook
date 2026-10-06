import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaymentProvider } from "@/lib/payments/provider";
import { getMockPayment } from "@/lib/payments/mock";
import { formatPrice } from "@/lib/utils/format-price";
import { noindexMetadata } from "@/lib/seo/metadata";
import { MockPayView } from "./MockPayView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = noindexMetadata("Test payment", "Development-only payment simulator.", "/checkout/mock-pay", false);

export default async function MockPayPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  if (process.env.NODE_ENV === "production" || getPaymentProvider().id !== "mock") notFound();
  const { ref } = await searchParams;
  const payment = ref ? getMockPayment(ref) : null;
  if (!payment) notFound();

  return (
    <MockPayView
      providerRef={payment.providerRef}
      orderNumber={payment.orderNumber}
      amount={formatPrice(payment.amount, payment.currency)}
      status={payment.status}
    />
  );
}
