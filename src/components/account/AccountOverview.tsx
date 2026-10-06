"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { ProductRow } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderView } from "@/lib/orders";
import { AccountPageHeader } from "./AccountSidebar/AccountSidebar";
import { OrderStatus } from "./OrderHistory/OrderStatus";
import { useAccountData } from "./useAccountData";
import { LoadError } from "./LoadError";
import { formatOrderDate } from "./format";

const linkCls = "inline-flex min-h-10 items-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline";

export function AccountOverview() {
  const t = useTranslations("account.overview");
  const { user } = useAuth();
  const welcome = useSearchParams().get("welcome") === "1";
  const { data, error, loading, reload } = useAccountData<{ orders: OrderView[] }>("/api/account/orders");
  const latest = data?.orders[0];
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "";

  return (
    <div>
      <AccountPageHeader title={firstName ? t("title", { name: firstName }) : t("titleNoName")}>
        <p className="m-0 text-ink-muted">{user?.email ? t("signedInAs", { email: user.email }) : null}</p>
      </AccountPageHeader>

      {welcome ? (
        <Alert tone="success" title={t("welcomeTitle")} className="mb-8">
          {t("welcomeBody")}
        </Alert>
      ) : null}

      <section aria-labelledby="latest-order" className="mb-12">
        <h2 id="latest-order" className="eyebrow m-0 mb-3">
          {t("latestTitle")}
        </h2>
        {loading ? (
          <div aria-busy="true" className="flex flex-col gap-3 border-t border-line py-5">
            <SkeletonBar className="w-1/3" />
            <SkeletonBar className="w-1/2" />
          </div>
        ) : error ? (
          <LoadError onRetry={reload} />
        ) : latest ? (
          <div className="border-y border-line py-4">
            <ProductRow
              name={latest.lines[0]?.name ?? latest.number}
              href={latest.lines[0]?.slug ? `/product/${latest.lines[0].slug}` : null}
              imageUrl={latest.lines[0]?.imageUrl}
              keyInfo={latest.lines[0]?.key}
              aside={<span className="price text-[1rem] text-ink">{formatPrice(latest.totals.total, latest.currency)}</span>}
            >
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <OrderStatus state={latest.state} />
                <span className="font-mono text-[0.75rem] text-ink-muted">
                  {latest.number} · {formatOrderDate(latest.createdAt)}
                </span>
                <Link href={`/account/orders/${latest.id}`} className={`${linkCls} ml-auto`}>
                  {t("view")}
                  <span className="sr-only"> {latest.number}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </ProductRow>
            {data && data.orders.length > 1 ? (
              <Link href="/account/orders" className={`${linkCls} mt-3`}>
                {t("allOrders", { count: data.orders.length })}
              </Link>
            ) : null}
          </div>
        ) : (
          <EmptyState title={t("noOrdersTitle")} subtitle={t("noOrdersBody")} actionLabel={t("browse")} actionHref="/catalog" headingLevel={3} align="start" className="border-t border-line px-0 py-8" />
        )}
      </section>

      <nav aria-label="Account shortcuts" className="flex flex-wrap gap-x-8 gap-y-1">
        <Link href="/account/orders" className={linkCls}>
          Orders and keys
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/account/profile" className={linkCls}>
          Profile
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/account/wishlist" className={linkCls}>
          Saved
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
