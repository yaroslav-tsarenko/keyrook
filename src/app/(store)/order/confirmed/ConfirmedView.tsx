"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyCheck, Copy, FileDown } from "lucide-react";
import { Tumbler } from "@/components/ui/Tumbler";
import { StatusPlate } from "@/components/ui/Plate";
import { Alert } from "@/components/ui/Alert";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { ProductRow } from "@/components/product/ProductCard";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { OrderKeys } from "@/components/account/OrderDetail/OrderDetail";
import { orderTimelineStatus } from "@/components/account/OrderHistory/OrderHistory";
import { TotalsList } from "@/components/checkout/TotalsList";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { plateStatusFor, type OrderView } from "@/lib/orders";
import { COMPANY } from "@/lib/company";
import { STORE_POLICY } from "@/config/store-policy";

type Verification = "confirmed" | "pending" | "failed" | "review" | "unavailable";
type ViewState = "checking" | Verification | "missing" | "notFound" | "error";

const MAX_ATTEMPTS = 10;
const INTERVAL_MS = 3000;

function OrderId({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="m-0 flex flex-wrap items-center gap-3">
      <span className="eyebrow">Order number</span>
      <Tumbler value={number} size="md" label={`Order number ${number}`} motion />
      <button
        type="button"
        aria-label={copied ? "Order number copied" : "Copy order number"}
        onClick={() => {
          navigator.clipboard?.writeText(number).then(() => setCopied(true), () => {});
        }}
        className="flex size-10 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:bg-raised hover-device:hover:text-ink"
      >
        {copied ? <CopyCheck size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </button>
    </p>
  );
}

function OrderSummary({ order, live = false }: { order: OrderView; live?: boolean }) {
  const t = useTranslations("checkout.confirmed");
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="confirmed-items">
        <h2 id="confirmed-items" className="eyebrow m-0 mb-3">
          {t("itemsTitle")}
        </h2>
        <ul className="m-0 flex list-none flex-col border-t border-rule p-0">
          {order.lines.map((line) => (
            <li key={line.id} className="flex flex-col gap-5 border-b border-line py-5">
              <ProductRow name={line.name} href={line.slug ? `/product/${line.slug}` : null} imageUrl={line.imageUrl} keyInfo={line.key} aside={<span className="font-mono text-data text-ink">{formatPrice(line.total, order.currency)}</span>} />
              {live ? (
                <>
                  <OrderTimeline status={orderTimelineStatus(order, line)} createdAt={order.createdAt} paidAt={order.paidAt} finishedAt={line.delivery?.finishedAt} refundedAt={line.delivery?.refundedAt} />
                  <OrderKeys order={order} line={line} />
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <TotalsList totals={order.totals} currency={order.currency} showCurrencyCode totalSize="md" className="mt-5" />
      </section>
      <div className="grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-2">
        <section aria-labelledby="confirmed-delivery">
          <h2 id="confirmed-delivery" className="eyebrow m-0 mb-2">
            {t("deliveryTitle")}
          </h2>
          <p className="m-0 text-ui-md leading-[1.6] text-ink">
            {STORE_POLICY.delivery.headline}
            <Link href="/account/keys" className="mt-1 block font-[560] underline decoration-1 underline-offset-4">
              Your keys in Account → Keys
            </Link>
          </p>
        </section>
        <section aria-labelledby="confirmed-when">
          <h2 id="confirmed-when" className="eyebrow m-0 mb-2">
            {t("whenTitle")}
          </h2>
          <p className="m-0 text-ui-md leading-[1.6] text-ink">{t("when", { usual: STORE_POLICY.delivery.usualTime })}</p>
        </section>
      </div>
    </div>
  );
}

export function ConfirmedView() {
  const t = useTranslations("checkout.confirmed");
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const orderId = searchParams.get("order");
  const [state, setState] = useState<ViewState>(orderId ? "checking" : "missing");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [run, setRun] = useState(0);
  const cleared = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: number | undefined;
    let attempt = 0;
    const poll = async () => {
      attempt += 1;
      try {
        const res = await fetch(`/api/orders/verify?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404 || res.status === 401) return setState("notFound");
        if (!res.ok) return setState("error");
        const data = (await res.json()) as { verification: Verification; order: OrderView };
        if (cancelled) return;
        setOrder(data.order);
        if (data.verification === "pending" && attempt < MAX_ATTEMPTS) {
          setState("checking");
          timer = window.setTimeout(poll, INTERVAL_MS);
          return;
        }
        setState(data.verification);
      } catch {
        if (!cancelled) setState("error");
      }
    };
    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderId, run]);

  useEffect(() => {
    if (state === "confirmed" && !cleared.current) {
      cleared.current = true;
      clearCart();
      try {
        sessionStorage.removeItem("keyrook-checkout-draft");
      } catch {}
    }
    if (state !== "checking") headingRef.current?.focus();
  }, [state, clearCart]);

  useEffect(() => {
    if (state !== "confirmed" || !orderId || !order?.inFlight) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/verify?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { order: OrderView };
        if (data.order) setOrder(data.order);
      } catch {}
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [state, orderId, order?.inFlight]);

  const recheck = () => {
    setState("checking");
    setRun((n) => n + 1);
  };

  const frame = (children: React.ReactNode) => (
    <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-gutter pb-24 pt-10 lg:pt-16">{children}</div>
  );

  if (state === "checking") {
    return frame(
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center" aria-live="polite">
        <ReadoutLoader label={t("checking.title")} />
        <h1 className="m-0 text-step-4 leading-[1.04] text-ink">{t("checking.title")}</h1>
        <p className="measure m-0 text-ink-muted">{t("checking.body")}</p>
      </div>,
    );
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="m-0 text-step-5 leading-[1.04] text-ink outline-none">
      {text}
    </h1>
  );

  if (state === "confirmed" && order) {
    return frame(
      <>
        <div className="flex flex-col gap-4">
          {heading(order.paymentStatus === "PAID" ? "Payment confirmed" : "Payment received")}
          <OrderId number={order.number} />
          <p className="measure m-0 text-step-1 text-ink-muted">
            We&apos;ve sent a receipt to {order.email}. Your keys appear in Account → Keys as soon as they&apos;re issued.
          </p>
        </div>
        <OrderSummary order={order} live />
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
          {user ? (
            <Button as={Link} href="/account/keys">
              Go to my keys
            </Button>
          ) : null}
          <Button as={Link} href="/catalog" variant="outline">
            Continue shopping
          </Button>
          {order.invoiceAvailable ? (
            <Button as="a" href={`/api/account/orders/${encodeURIComponent(order.id)}/invoice`} download variant="ghost" startContent={<FileDown size={16} aria-hidden="true" />}>
              Download invoice (PDF)
            </Button>
          ) : null}
        </div>
      </>,
    );
  }

  if (state === "failed") {
    return frame(
      <>
        <div className="flex flex-col gap-4">
          {order ? <StatusPlate status={plateStatusFor("paymentFailed")} label={t("plates.failed")} className="self-start" /> : null}
          {heading(t("failed.title"))}
          <p className="measure m-0 text-step-1 text-ink-muted">{t("failed.body")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button as={Link} href="/checkout?payment=failed">
            {t("failed.retry")}
          </Button>
          <Button as={Link} href="/cart" variant="outline">
            {t("failed.cart")}
          </Button>
        </div>
        <p className="m-0 text-ui-sm text-ink-muted">{t("failed.help", { email: COMPANY.email })}</p>
      </>,
    );
  }

  if ((state === "pending" || state === "review" || state === "unavailable") && order) {
    const key = state === "pending" ? "pending" : state === "review" ? "review" : "unavailable";
    return frame(
      <>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPlate status={plateStatusFor("awaitingPayment")} label={t("plates.awaiting")} />
            <Tumbler value={order.number} size="sm" label={`Order number ${order.number}`} />
          </div>
          {heading(t(`${key}.title`))}
          <p className="measure m-0 text-step-1 text-ink-muted">
            {t(`${key}.body`, { email: order.email, replyTime: STORE_POLICY.support.replyTime, support: COMPANY.email })}
          </p>
        </div>
        {state !== "review" ? (
          <div className="flex flex-wrap items-center gap-4">
            <Button onPress={recheck}>{t("pending.recheck")}</Button>
            <Button as={Link} href="/contact" variant="outline">
              {t("contactUs")}
            </Button>
          </div>
        ) : (
          <Button as={Link} href="/contact" variant="outline" className="self-start">
            {t("contactUs")}
          </Button>
        )}
        <OrderSummary order={order} />
      </>,
    );
  }

  if (state === "missing") {
    return frame(
      <>
        {heading(t("missing.title"))}
        <p className="measure m-0 text-step-1 text-ink-muted">{t("missing.body")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button as={Link} href={user ? "/account/orders" : "/catalog"}>
            {user ? t("missing.orders") : t("continueShopping")}
          </Button>
          <Button as={Link} href="/cart" variant="outline">
            {t("failed.cart")}
          </Button>
        </div>
      </>,
    );
  }

  return frame(
    <>
      {heading(t("error.title"))}
      <Alert tone="danger" title={state === "notFound" ? t("error.notFound") : t("error.generic")}>
        {t("error.body", { email: COMPANY.email })}
      </Alert>
      <div className="flex flex-wrap items-center gap-4">
        <Button onPress={recheck} isDisabled={!orderId}>
          {t("pending.recheck")}
        </Button>
        <Button as={Link} href="/contact" variant="outline">
          {t("contactUs")}
        </Button>
      </div>
    </>,
  );
}
