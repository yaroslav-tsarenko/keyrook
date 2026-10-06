"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { SkinRow } from "@/components/skin/SkinTray";
import { PurchaseTimeline } from "@/components/skin/PurchaseTimeline";
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
  if (order.state === "delivered") return "finished";
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
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono text-data text-ink">{order.number}</span>
                <span className="font-mono text-[0.75rem] text-ink-muted">{formatOrderDate(order.createdAt)}</span>
                <OrderStatus state={order.state} />
                <Link
                  href={`/account/orders/${order.id}`}
                  className="ml-auto inline-flex min-h-10 items-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
                >
                  {t("view")}
                  <span className="sr-only"> {order.number}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <ul className="m-0 flex list-none flex-col gap-6 p-0">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex flex-col gap-4">
                    <SkinRow
                      name={line.name}
                      href={line.slug ? `/product/${line.slug}` : null}
                      imageUrl={line.imageUrl}
                      skin={line.skin}
                      size="md"
                      aside={<span className="price text-[1rem] text-ink">{formatPrice(line.total, order.currency)}</span>}
                    />
                    <PurchaseTimeline
                      status={orderTimelineStatus(order, line)}
                      paidAt={order.paidAt}
                      finishedAt={line.delivery?.finishedAt}
                      refundedAt={line.delivery?.refundedAt}
                      offerUrl={line.delivery?.offerUrl}
                      expiresAt={line.delivery?.expiresAt}
                      className="sm:pl-[184px]"
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {polling ? <p className="m-0 mt-4 text-ui-sm text-ink-muted">This page updates while your skins are being delivered.</p> : null}
    </div>
  );
}
