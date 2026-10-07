"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface MockPayViewProps {
  providerRef: string;
  orderNumber: string;
  amount: string;
  status: "paid" | "failed" | "pending";
}

export function MockPayView({ providerRef, orderNumber, amount, status }: MockPayViewProps) {
  const [busy, setBusy] = useState<"paid" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const complete = async (outcome: "paid" | "failed") => {
    setBusy(outcome);
    setError(null);
    try {
      const res = await fetch("/api/checkout/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: providerRef, outcome }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && typeof body.redirectUrl === "string") {
        window.location.assign(body.redirectUrl);
        return;
      }
      setError(`Test payment failed: ${body.code ?? res.status}`);
    } catch {
      setError("Test payment failed: network error");
    }
    setBusy(null);
  };

  return (
    <div className="mx-auto flex max-w-narrow flex-col gap-5 px-gutter py-12">
      <p className="eyebrow m-0 text-ink-muted">Development only</p>
      <h1 className="m-0 text-step-4 leading-[1.1] text-ink">Test payment</h1>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4 text-ui-md">
        <dt className="text-ink-muted">Order</dt>
        <dd className="m-0 font-mono text-ink">{orderNumber}</dd>
        <dt className="text-ink-muted">Amount</dt>
        <dd className="tabular m-0 text-ink">{amount}</dd>
        <dt className="text-ink-muted">Reference</dt>
        <dd className="m-0 break-all font-mono text-ui-sm text-ink">{providerRef}</dd>
      </dl>
      <p className="m-0 text-ui-md text-ink-muted">
        No card is charged. Pay or Fail sets this test payment’s state and sends a signed webhook to the store, which re-checks the state before settling the order.
      </p>
      {status !== "pending" ? <Alert tone="info">This test payment is already {status}. Sending again only re-delivers the webhook.</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onPress={() => complete("paid")} isLoading={busy === "paid"} isDisabled={busy !== null}>
          Pay {amount}
        </Button>
        <Button size="lg" variant="outline" onPress={() => complete("failed")} isLoading={busy === "failed"} isDisabled={busy !== null}>
          Fail payment
        </Button>
      </div>
    </div>
  );
}
