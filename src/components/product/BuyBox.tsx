"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pin, RotateCcwKey, ShieldCheck, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Lamp } from "@/components/ui/Lamp";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { useWishlist } from "@/providers/WishlistProvider";
import { useCart } from "@/providers/CartProvider";
import { itemQuantityCap } from "@/lib/pricing";
import { STORE_POLICY } from "@/config/store-policy";
import { productFace, useAddToCart, type CatalogProduct } from "./ProductCard";

export interface PlatformAlternative {
  label: string;
  href: string;
  tone: string;
}

export interface BuyBoxProps {
  product: CatalogProduct;
  alternatives?: PlatformAlternative[];
  priceAvailable?: boolean;
  className?: string;
}

export function BuyBox({ product, alternatives = [], priceAvailable = true, className }: BuyBoxProps) {
  const router = useRouter();
  const { isSaved, toggle, pending } = useWishlist();
  const { cart } = useCart();
  const { add, inCart, openSheet, price } = useAddToCart(product);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const face = productFace(product.name, product.key);
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const pinned = isSaved(product.id);
  const cap = itemQuantityCap(product.quantity, product.key?.productType);
  const inCartQty = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const compare = product.comparePrice != null ? Number(product.comparePrice) : null;
  const sellable = !outOfStock && priceAvailable;

  useEffect(() => {
    const node = actionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sticky-bar-offset", barVisible && sellable ? "64px" : "0px");
    return () => {
      document.documentElement.style.removeProperty("--sticky-bar-offset");
    };
  }, [barVisible, sellable]);

  const source = (e: MouseEvent<HTMLElement>) => e.currentTarget.closest("[data-product]")?.querySelector("[data-cover]") ?? null;
  const addFrom = (e: MouseEvent<HTMLElement>) => {
    setAdding(true);
    add(source(e), quantity);
    window.setTimeout(() => setAdding(false), 160);
  };
  const buyNow = (e: MouseEvent<HTMLElement>) => {
    if (!inCart) add(source(e), quantity);
    router.push("/checkout");
  };

  const rows = [
    { key: "delivery", Icon: Timer, text: STORE_POLICY.delivery.headline, href: null as string | null, show: true },
    { key: "secure", Icon: ShieldCheck, text: "Card payment on a hosted page with 3-D Secure.", href: null, show: STORE_POLICY.payment.hostedPage && STORE_POLICY.payment.threeDSecure },
    { key: "guarantee", Icon: RotateCcwKey, text: `${STORE_POLICY.guarantee.headline}.`, href: "/policies/returns#when-we-refund", show: STORE_POLICY.guarantee.faultyKey },
  ].filter((r) => r.show);

  return (
    <section aria-label="Buy" data-buy-box="" data-platform={face.tone} className={cn("plate p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        {!priceAvailable ? (
          <p className="m-0 text-step-1 text-ink-muted">Price unavailable right now</p>
        ) : outOfStock ? (
          <span className="flex flex-col gap-1">
            <span className="text-ui-sm text-ink-muted">Last price</span>
            <PriceDisplay price={price} size="xl" className="[&_[data-price]]:text-ink-muted" />
          </span>
        ) : (
          <PriceDisplay price={price} comparePrice={compare} size="xl" layout="inline" />
        )}
        <p data-stock={outOfStock ? "out" : "in"} className="m-0 flex items-center gap-2 text-ui-md text-ink">
          <Lamp on={!outOfStock} />
          {outOfStock ? "Out of stock" : "In stock"}
        </p>
      </div>
      {compare && compare > price && !outOfStock ? (
        <p className="m-0 mt-2 text-ui-xs text-ink-muted">The earlier price is the lowest price this key had in the {STORE_POLICY.deals.compareWindowDays} days before the cut.</p>
      ) : null}

      <div ref={actionRef} data-action="" className="mt-5 flex flex-col gap-3">
        {outOfStock ? (
          <>
            <Button size="lg" isDisabled fullWidth>
              Out of stock
            </Button>
            <p className="m-0 text-ui-md text-ink-muted">This key isn&apos;t in stock right now.</p>
            {alternatives.length ? (
              <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                {alternatives.map((alt) => (
                  <li key={alt.href} data-platform={alt.tone}>
                    <Link href={alt.href} className="inline-flex min-h-10 items-center gap-2 text-ui-md font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                      <span aria-hidden="true" className="size-1.5 bg-platform" />
                      On {alt.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : !priceAvailable ? (
          <Button size="lg" isDisabled fullWidth>
            Add to cart
          </Button>
        ) : inCart ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 flex items-center gap-2 text-ui-md text-ink">
              <Check size={16} aria-hidden="true" />
              In cart{inCartQty > 1 ? ` · ${inCartQty}` : ""} ·{" "}
              <button type="button" onClick={openSheet} className="btn-text cursor-pointer font-[560] text-ink">
                <span data-label="">View cart</span>
              </button>
            </p>
            <Button size="lg" fullWidth as={Link} href="/checkout">
              Checkout
            </Button>
          </div>
        ) : (
          <>
            {cap > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuantitySelector quantity={quantity} maxQuantity={cap} onChange={setQuantity} showStockHint={false} label="Number of keys" />
                <span className="text-ui-sm text-ink-muted">Up to {cap} per order</span>
              </div>
            ) : null}
            <Button size="lg" fullWidth onClick={addFrom} isLoading={adding} data-add="">
              Add to cart
            </Button>
            <Button size="lg" fullWidth variant="outline" onClick={buyNow}>
              Buy now
            </Button>
          </>
        )}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          disabled={pending(product.id)}
          aria-pressed={pinned}
          className="btn-text inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 text-ui-md font-[560] text-ink disabled:cursor-wait"
        >
          <Pin size={18} aria-hidden="true" fill={pinned ? "currentColor" : "none"} />
          <span data-label="">{pinned ? "Pinned" : "Pin for later"}</span>
        </button>
      </div>

      <ul className="m-0 mt-4 list-none border-t border-line p-0">
        {rows.map(({ key, Icon, text, href }) => (
          <li key={key} className="flex items-start gap-3 border-b border-line py-3">
            <Icon size={18} aria-hidden="true" className="mt-0.5 text-ink-muted" />
            {href ? (
              <Link href={href} className="text-ui-md text-ink underline decoration-line-hover decoration-1 underline-offset-4 hover-device:hover:decoration-ink">
                {text}
              </Link>
            ) : (
              <p className="m-0 text-ui-md text-ink">{text}</p>
            )}
          </li>
        ))}
      </ul>
      <PaymentLogos height={20} className="mt-4" />

      {sellable ? (
        <div
          data-sticky-buy=""
          aria-hidden={!barVisible}
          inert={!barVisible}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-between gap-4 border-t border-line bg-raised px-gutter transition-transform duration-[180ms] ease-[var(--ease-latch)] lg:hidden",
            barVisible ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="min-w-0">
            <p className="m-0 truncate text-ui-sm text-ink-muted">{face.title}</p>
            <PriceDisplay price={price} size="sm" />
          </div>
          {inCart ? (
            <Button size="md" as={Link} href="/checkout">
              Checkout
            </Button>
          ) : (
            <Button size="md" onClick={addFrom}>
              Add to cart
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export { BuyBox as ProductBuyBox };
