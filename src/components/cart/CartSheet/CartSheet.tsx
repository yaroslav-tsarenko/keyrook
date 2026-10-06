"use client";

import { useId } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/components/cart/CartItem/CartItem";
import { EmptyBay } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { COMPANY } from "@/lib/company";

const EMPTY_LINKS = [
  { href: "/catalog/games", label: "Games" },
  { href: "/catalog/gift-cards", label: "Gift cards" },
  { href: "/catalog/subscriptions", label: "Subscriptions" },
];

export function CartSheet() {
  const { cart, displayTotals, isSheetOpen, closeSheet } = useCart();
  const { currency } = useCurrency();
  const titleId = useId();
  const count = cart.itemCount;

  return (
    <Sheet open={isSheetOpen} onClose={closeSheet} side="right" labelledBy={titleId}>
      <div data-cart-panel="" className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line pl-6 pr-3">
          <div className="flex items-baseline gap-3">
            <h2 id={titleId} className="text-step-2 font-semibold leading-none text-ink">
              Cart
            </h2>
            {count > 0 ? <span className="font-mono text-data text-ink-muted">{count}</span> : null}
          </div>
          <button type="button" onClick={closeSheet} aria-label="Close cart" className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink hover-device:hover:bg-surface-1">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-3 px-6 py-12">
            <EmptyBay />
            <p className="m-0 mt-3 font-display text-step-2 font-semibold leading-[1.12] text-ink">Your cart is empty</p>
            <ul className="m-0 flex list-none gap-5 p-0">
              {EMPTY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={closeSheet} className="text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button as={Link} href="/catalog" variant="outline" onClick={closeSheet} className="mt-4">
              Browse the catalogue
            </Button>
          </div>
        ) : (
          <>
            <ul aria-label="Items in your cart" className="m-0 min-h-0 flex-1 list-none divide-y divide-line overflow-y-auto px-6 py-1">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} onNavigate={closeSheet} />
              ))}
            </ul>
            <div className="shrink-0 border-t border-line px-6 pb-6 pt-5">
              <dl className="m-0 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ui-md text-ink-muted">Subtotal</dt>
                  <dd className="m-0 font-mono text-data text-ink">{formatPrice(displayTotals.subtotal, currency)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-step-0 font-semibold text-ink">{COMPANY.vatRegistered ? "Total incl. VAT" : "Total"}</dt>
                  <dd className="price m-0 text-step-2 leading-none text-ink">{formatPrice(displayTotals.total, currency)}</dd>
                </div>
              </dl>
              <p className="m-0 mt-3 text-ui-sm text-ink-muted">Prices are re-confirmed when you pay. If one changes, you&apos;ll see it before paying.</p>
              <Button as={Link} href="/checkout" size="lg" fullWidth onClick={closeSheet} className="mt-5">
                Checkout
              </Button>
              <div className="mt-3 flex items-center justify-between gap-4">
                <Button as={Link} href="/cart" variant="ghost" onClick={closeSheet}>
                  View cart
                </Button>
                <PaymentLogos height={24} />
              </div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
