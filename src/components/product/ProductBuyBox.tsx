"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, CircleCheck, CircleHelp, KeyRound, LockKeyhole, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { KeyPlates, TypeLine, productFace, useAddToCart, type CatalogProduct } from "./ProductCard";
import { useWishlist } from "@/providers/WishlistProvider";
import { useCart } from "@/providers/CartProvider";
import { itemQuantityCap } from "@/lib/pricing";
import { STORE_POLICY } from "@/config/store-policy";
import { redeemTitle } from "@/lib/keys/taxonomy";

export interface KeyFact {
  label: string;
  value: string;
  note?: string | null;
}

export interface ProductBuyBoxProps {
  product: CatalogProduct;
  facts: KeyFact[];
  breadcrumbs?: ReactNode;
  alternativesHref: string | null;
}

export function ProductBuyBox({ product, facts, breadcrumbs, alternativesHref }: ProductBuyBoxProps) {
  const router = useRouter();
  const { isSaved, toggle, pending } = useWishlist();
  const { cart } = useCart();
  const { add, inCart, openSheet, price } = useAddToCart(product);
  const [quantity, setQuantity] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const face = productFace(product.name, product.key);
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const saved = isSaved(product.id);
  const cap = itemQuantityCap(product.quantity, product.key?.productType);
  const inCartQty = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const d = STORE_POLICY.delivery;

  useEffect(() => {
    const node = actionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sticky-bar-offset", barVisible ? "64px" : "0px");
    return () => {
      document.documentElement.style.removeProperty("--sticky-bar-offset");
    };
  }, [barVisible]);

  const source = (e: MouseEvent<HTMLElement>) => e.currentTarget.closest("[data-product]")?.querySelector("[data-cover]") ?? null;
  const addFrom = (e: MouseEvent<HTMLElement>) => add(source(e), quantity);
  const buyNow = (e: MouseEvent<HTMLElement>) => {
    if (!inCart) add(source(e), quantity);
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col">
      {breadcrumbs}
      <KeyPlates face={face} className="mb-3" />
      <TypeLine face={face} />
      <h1 className="m-0 mt-2 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">{face.title}</h1>

      <dl className="m-0 mt-6 border-t border-line">
        {facts.map((fact) => (
          <div key={fact.label} className="grid min-h-11 grid-cols-[132px_minmax(0,1fr)] items-start gap-4 border-b border-line py-2.5">
            <dt className="eyebrow pt-0.5">{fact.label}</dt>
            <dd className="m-0 text-ui-md text-ink">
              {fact.value}
              {fact.note ? <span className="mt-0.5 block text-ui-sm text-ink-muted">{fact.note}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 flex items-end justify-between gap-4">
        {outOfStock ? (
          <span className="flex items-baseline gap-2 font-mono text-data text-ink-muted">
            Last price <PriceDisplay price={price} size="sm" />
          </span>
        ) : (
          <PriceDisplay price={price} comparePrice={product.comparePrice ? Number(product.comparePrice) : null} size="lg" />
        )}
        {!outOfStock && product.quantity !== undefined && product.quantity <= 3 ? <span className="font-mono text-[0.75rem] text-ink-muted">{product.quantity} left</span> : null}
      </div>
      {product.comparePrice ? <p className="m-0 mt-1 text-ui-xs text-ink-muted">Struck-through price: the lowest price for this product in the 30 days before the current price.</p> : null}

      <div ref={actionRef} data-action="" className="mt-4 flex flex-col gap-3">
        {outOfStock ? (
          <>
            <Button size="lg" isDisabled fullWidth>
              Out of stock
            </Button>
            <p className="m-0 text-ui-md text-ink-muted">
              This product isn&apos;t available right now.{" "}
              {alternativesHref ? (
                <Link href={alternativesHref} className="font-semibold text-ink underline decoration-1 underline-offset-4">
                  See similar products
                </Link>
              ) : null}
            </p>
          </>
        ) : inCart ? (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" onPress={openSheet} startContent={<Check size={18} aria-hidden="true" />}>
              In cart ({inCartQty})
            </Button>
            <Button size="lg" as={Link} href="/checkout">
              Checkout
            </Button>
          </div>
        ) : (
          <>
            {cap > 1 ? <QuantitySelector quantity={quantity} maxQuantity={cap} onChange={setQuantity} showStockHint={false} label="Number of keys" /> : null}
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" onClick={addFrom} startContent={<Plus size={18} aria-hidden="true" />}>
                Add to cart
              </Button>
              <Button size="lg" variant="outline" onClick={buyNow}>
                Buy now
              </Button>
            </div>
            <p className="m-0 text-ui-sm text-ink-muted">Up to {cap} per order for this product.</p>
          </>
        )}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          disabled={pending(product.id)}
          aria-pressed={saved}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline disabled:cursor-wait"
        >
          <Bookmark size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <section aria-label="How you receive it" className="mt-6 border-t border-line pt-5">
        <ol className="relative m-0 grid list-none grid-cols-3 gap-3 p-0">
          <span aria-hidden="true" className="absolute left-1 right-[calc(33.333%-0.25rem)] top-[4px] h-px bg-rule" />
          {["Pay by card", "Key issued to your account", redeemTitle(face.platformKey)].map((step) => (
            <li key={step} className="relative pt-5">
              <span aria-hidden="true" className="absolute left-0 top-0 size-[9px] rounded-full border border-ink bg-surface" />
              <span className="block text-ui-sm leading-[1.35] text-ink">{step}</span>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-3 text-ui-sm text-ink-muted">Your key appears {d.where}, {d.usualTime}.</p>
      </section>

      <ul className="m-0 mt-5 list-none border-t border-line p-0">
        <li className="flex items-start gap-3 border-b border-line py-3">
          <KeyRound size={18} aria-hidden="true" className="mt-0.5 text-ink" />
          <p className="m-0 text-ui-md text-ink">{d.emailNote}</p>
        </li>
        <li className="flex items-start gap-3 border-b border-line py-3">
          <CircleCheck size={18} aria-hidden="true" className="mt-0.5 text-ink" />
          <p className="m-0 text-ui-md text-ink">
            {STORE_POLICY.guarantee.summary}{" "}
            <Link href="/policies/warranty" className="font-semibold underline decoration-1 underline-offset-4">
              Key guarantee
            </Link>
          </p>
        </li>
        <li className="flex items-center gap-3 border-b border-line py-3">
          <LockKeyhole size={18} aria-hidden="true" className="text-ink" />
          <p className="m-0 flex-1 text-ui-md text-ink">Card payment</p>
          <PaymentLogos height={20} withPci={false} />
        </li>
        <li className="flex items-center gap-3 border-b border-line py-3">
          <CircleHelp size={18} aria-hidden="true" className="text-ink" />
          <Link href="/how-it-works" className="text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            How delivery works
          </Link>
        </li>
      </ul>

      {!outOfStock ? (
        <div
          data-sticky-buy=""
          aria-hidden={!barVisible}
          inert={!barVisible}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-between gap-4 border-t border-line bg-raised px-gutter transition-transform duration-[200ms] ease-[var(--ease-instrument)] lg:hidden",
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
    </div>
  );
}
