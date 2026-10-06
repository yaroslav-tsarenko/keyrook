"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SkinRow } from "@/components/skin/SkinTray";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import { COMPANY } from "@/lib/company";
import type { CartItem } from "@/types/cart";
import type { Totals } from "@/lib/pricing";
import type { ClientQuote } from "./useCheckoutQuote";
import { TotalsList } from "./TotalsList";

interface CheckoutCounterProps {
  items: CartItem[];
  totals: Totals;
  currency: string;
  quote: ClientQuote | null;
  loading?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}

export const POLICY_LINKS = [
  { href: "/policies/terms", key: "terms" },
  { href: "/policies/returns", key: "returns" },
  { href: "/policies/privacy", key: "privacy" },
] as const;

export function CheckoutCounter({ items, totals, currency, quote, loading, headingLevel = 2, className }: CheckoutCounterProps) {
  const t = useTranslations("checkout.counter");
  const tp = useTranslations("checkout.policies");
  const Heading = `h${headingLevel}` as "h2" | "h3";

  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy={loading || undefined}>
      <div className="flex items-baseline justify-between gap-4">
        <Heading className="m-0 text-step-2 font-semibold leading-none text-ink">{t("title")}</Heading>
        <Link href="/cart" className="text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
          {t("editBag")}
        </Link>
      </div>

      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
        {items.map((item, index) => {
          const line = quote && quote.currency === currency ? quote.lines[index] : null;
          const lineTotal = line?.total ?? totals.lines[index]?.total ?? 0;
          return (
            <li key={item.id} className="py-3 first:pt-0">
              <SkinRow name={item.name} imageUrl={item.imageUrl} skin={item.skin} showRarity={false} aside={<span className="font-mono text-data text-ink">{formatPrice(lineTotal, currency)}</span>} />
            </li>
          );
        })}
      </ul>

      <TotalsList totals={totals} currency={currency} />

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line pt-4 text-ui-sm">
        <dt className="text-ink-muted">{t("soldBy")}</dt>
        <dd className="m-0 text-ink">{t("sellerLine", { company: COMPANY.name, address: COMPANY.registeredOffice })}</dd>
        <dt className="text-ink-muted">{t("merchant")}</dt>
        <dd className="m-0 text-ink">{COMPANY.name}</dd>
      </dl>

      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 border-t border-line p-0 pt-4">
        {POLICY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} target="_blank" className="text-ui-sm text-ink-muted underline decoration-1 underline-offset-4 hover-device:hover:text-ink">
              {tp(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
