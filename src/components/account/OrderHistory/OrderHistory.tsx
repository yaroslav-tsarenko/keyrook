"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, FileDown } from "lucide-react";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { ProductRow } from "@/components/product/ProductCard";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderView } from "@/lib/orders";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";
import { formatOrderDate } from "../format";
import { OrderStatus } from "./OrderStatus";

const POLL_MS = 15_000;

export function orderTimelineStatus(order: OrderView, line: OrderView["lines"][number]): string {
  if (line.delivery) return line.delivery.status;
  if (order.state === "awaitingPayment" || order.state === "paymentFailed") return "awaiting_payment";
  if (order.state === "refunded") return "refunded";
  if (order.state === "delivered") return "delivered";
  return "paid";
}

export function OrderHistory() {
  const t = useTranslations("account.orders");
  const { data, error, loading, reload, refresh } = useAccountData<{ orders: OrderView[] }>("/api/account/orders");
  const orders = [...(data?.orders ?? [])].sort((a, b) => Number(b.inFlight) - Number(a.inFlight) || b.createdAt.localeCompare(a.createdAt));
  const polling = orders.some((o) => o.inFlight);

  useEffect(() => {
    if (!polling) return;
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [polling, refresh]);

  return (
    <div>
      <AccountPageHeader title={t("title")} />
      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-4 border-t border-line pt-5">
          {[0, 1, 2].map((i) => (
            <SkeletonBar key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState title={t("emptyTitle")} subtitle={t("emptyBody")} actionLabel={t("browse")} actionHref="/catalog" align="start" className="border-t border-line px-0 py-10" />
      ) : (
        <ol className="m-0 list-none border-t border-rule p-0">
          {orders.map((order) => (
            <li key={order.id} data-purchase="" className="border-b border-line py-6">
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-mono text-data font-medium text-ink">{order.number}</span>
                <span className="font-mono text-[0.75rem] text-ink-muted">{formatOrderDate(order.createdAt)}</span>
                <span className="price text-data text-ink">{formatPrice(order.totals.total, order.currency)}</span>
                <OrderStatus state={order.state} />
              </div>
              <ul className="m-0 flex list-none flex-col gap-5 p-0">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex flex-col gap-4">
                    <ProductRow name={line.name} href={line.slug ? `/product/${line.slug}` : null} imageUrl={line.imageUrl} keyInfo={line.key} aside={<span className="price text-ui-md text-ink">{formatPrice(line.total, order.currency)}</span>} />
                    <OrderTimeline
                      status={order.state === "paymentFailed" ? "payment_failed" : orderTimelineStatus(order, line)}
                      createdAt={order.createdAt}
                      paidAt={order.paidAt}
                      finishedAt={line.delivery?.finishedAt}
                      refundedAt={line.delivery?.refundedAt}
                      className="sm:pl-[76px]"
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 sm:pl-[76px]">
                {order.invoiceAvailable ? (
                  <a href={`/api/account/orders/${encodeURIComponent(order.id)}/invoice`} download className="inline-flex min-h-10 items-center gap-1.5 text-ui-sm font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                    <FileDown size={16} aria-hidden="true" />
                    Invoice (PDF)
                  </a>
                ) : null}
                <Link href={`/account/orders/${order.id}`} className="inline-flex min-h-10 items-center gap-1.5 text-ui-sm font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                  {t("view")}
                  <span className="sr-only"> {order.number}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
      {polling ? <p className="m-0 mt-4 text-ui-sm text-ink-muted">This page updates while your keys are being issued.</p> : null}
    </div>
  );
}
