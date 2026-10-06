"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { Button } from "@/components/ui/Button";
import { Tumbler } from "@/components/ui/Tumbler";
import { ProductRow } from "@/components/product/ProductCard";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { KeyPlate, type KeyPlateStatus } from "@/components/account/KeyPlate";
import { orderTimelineStatus } from "../OrderHistory/OrderHistory";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { TotalsList } from "@/components/checkout/TotalsList";
import { formatPrice } from "@/lib/utils/format-price";
import { addressLines, type OrderView } from "@/lib/orders";
import { STORE_POLICY } from "@/config/store-policy";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { OrderStatus } from "../OrderHistory/OrderStatus";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";
import { formatOrderDate } from "../format";

const POLL_MS = 15_000;

export function keyPlateStatus(status: string): KeyPlateStatus {
  if (status === "delivered") return "ready";
  if (status === "refunded" || status === "refund_pending" || status === "failed") return "refunded";
  return "issuing";
}

export function OrderKeys({ order, line }: { order: OrderView; line: OrderView["lines"][number] }) {
  const delivery = line.delivery;
  const delivered = Boolean(delivery && delivery.status === "delivered" && delivery.keys.length);
  const issuing = Boolean(delivery?.inFlight) && !delivered;
  const [sawIssuing, setSawIssuing] = useState(issuing);
  if (issuing && !sawIssuing) setSawIssuing(true);
  const justIssued = delivered && sawIssuing;
  if (!delivery) return null;
  if (delivery.status === "delivered" && delivery.keys.length) {
    return (
      <div className="flex flex-col gap-4">
        {delivery.keys.map((k, i) => (
          <KeyPlate
            key={k.id}
            keyId={k.id}
            title={line.name}
            productSlug={line.slug}
            keyInfo={line.key}
            index={i + 1}
            total={delivery.keys.length}
            status="ready"
            keyType={k.type}
            revealedBefore={k.revealed}
            issuedAt={k.issuedAt ?? delivery.finishedAt}
            revealedAt={k.revealedAt}
            orderNumber={order.number}
            justIssued={justIssued}
          />
        ))}
      </div>
    );
  }
  if (delivery.inFlight) return <KeyPlate keyId={line.id} title={line.name} productSlug={line.slug} keyInfo={line.key} status="issuing" orderNumber={order.number} />;
  return null;
}

export function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("account.order");
  const { data, error, loading, reload, refresh } = useAccountData<{ order: OrderView }>(`/api/account/orders/${encodeURIComponent(id)}`);
  const order = data?.order;
  const polling = Boolean(order?.inFlight);

  useEffect(() => {
    if (!polling) return;
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [polling, refresh]);

  if (loading) return <ReadoutLoader block label={t("loading")} />;
  if (error || !order) {
    return (
      <div>
        <AccountPageHeader title={t("notFoundTitle")} />
        {error ? <LoadError onRetry={reload} /> : null}
        <EmptyState title={t("notFoundTitle")} subtitle={t("notFoundBody")} actionLabel={t("backToOrders")} actionHref="/account/orders" align="start" headingLevel={2} className="px-0" />
      </div>
    );
  }

  return (
    <div>
      <AccountPageHeader
        title={
          <>
            Order <Tumbler value={order.number} size="md" label={order.number} motion className="ml-1 align-[0.12em]" />
          </>
        }
        aside={<OrderStatus state={order.state} />}
      >
        <p className="m-0 font-mono text-data text-ink-muted">{t("placedOn", { date: formatOrderDate(order.createdAt, true) })}</p>
      </AccountPageHeader>

      <section aria-labelledby="order-items" className="mb-12">
        <h2 id="order-items" className="sr-only">
          {t("itemsTitle")}
        </h2>
        <ul className="m-0 flex list-none flex-col border-t border-rule p-0">
          {order.lines.map((line) => (
            <li key={line.id} className="flex flex-col gap-7 border-b border-line py-7">
              <ProductRow name={line.name} href={line.slug ? `/product/${line.slug}` : null} imageUrl={line.imageUrl} keyInfo={line.key} size="md" aside={<span className="price text-step-1 text-ink">{formatPrice(line.total, order.currency)}</span>} />
              <OrderTimeline
                size="large"
                status={order.state === "paymentFailed" ? "payment_failed" : orderTimelineStatus(order, line)}
                createdAt={order.createdAt}
                paidAt={order.paidAt}
                finishedAt={line.delivery?.finishedAt}
                refundedAt={line.delivery?.refundedAt}
                revealedAt={line.delivery?.keys.find((k) => k.revealedAt)?.revealedAt ?? null}
                showRevealed
              />
              {line.delivery?.note ? <p className="m-0 text-ui-md text-ink">{line.delivery.note}</p> : null}
              <OrderKeys order={order} line={line} />
            </li>
          ))}
        </ul>
        {polling ? (
          <p className="m-0 mt-4 text-ui-sm text-ink-muted" aria-live="polite">
            {t("liveUpdates")}
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="grid grid-cols-1 content-start gap-8 sm:grid-cols-2 md:grid-cols-1">
          <section aria-labelledby="order-delivery">
            <h2 id="order-delivery" className="eyebrow m-0 mb-2">
              {t("deliveryTitle")}
            </h2>
            <p className="m-0 text-ui-sm leading-[1.6] text-ink">{STORE_POLICY.delivery.headline}</p>
            {order.waiverAcceptedAt ? <p className="m-0 mt-3 text-ui-sm text-ink-muted">{t("waiver", { date: formatOrderDate(order.waiverAcceptedAt, true) })}</p> : null}
          </section>
          <section aria-labelledby="order-billing">
            <h2 id="order-billing" className="eyebrow m-0 mb-2">
              {t("billingTitle")}
            </h2>
            <p className="m-0 text-ui-sm leading-[1.6] text-ink">
              {addressLines(order.billing ?? order.delivery).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="m-0 mt-3 text-ui-sm text-ink-muted">{t("paymentMethod")}</p>
          </section>
        </div>
        <section aria-labelledby="order-totals" className="plate self-start p-6">
          <h2 id="order-totals" className="m-0 mb-5 text-step-2 leading-none text-ink">
            {t("totalsTitle")}
          </h2>
          <TotalsList totals={order.totals} currency={order.currency} showCurrencyCode totalSize="md" />
          {order.invoiceAvailable ? (
            <Button as="a" href={`/api/account/orders/${encodeURIComponent(order.id)}/invoice`} download variant="ghost" size="sm" startContent={<FileDown size={16} aria-hidden="true" />} className="mt-5">
              {t("invoiceDownload")}
            </Button>
          ) : null}
        </section>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8">
        <h2 className="m-0 text-step-2 leading-none text-ink">Need help with this order?</h2>
        <p className="m-0 text-ink-muted">{t("helpBody")}</p>
        <Button as={Link} href={`/contact?order=${encodeURIComponent(order.number)}`} variant="outline" className="mt-2 self-start">
          {t("helpAction")}
        </Button>
      </div>
    </div>
  );
}
