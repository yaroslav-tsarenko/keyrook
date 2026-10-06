"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ArrowRight, CircleCheck, CreditCard, KeyRound, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { ProductCover } from "@/components/product/ProductCover";
import { KeyPlates, TypeLine, productFace, useAddToCart, type CatalogProduct } from "@/components/product/ProductCard";
import { STORE_POLICY } from "@/config/store-policy";

export interface HeroProps {
  liveCount: number;
  hero: CatalogProduct | null;
}

const PROPS = [
  { Icon: KeyRound, title: "Keys go to your account", body: `They appear on your order page ${STORE_POLICY.delivery.usualTime}.` },
  { Icon: CreditCard, title: "The price you see is what you pay", body: "No fees added at checkout. Prices are re-checked before you pay." },
  { Icon: CircleCheck, title: "Replaced or refunded", body: `If a key does not activate, tell us within ${STORE_POLICY.guarantee.claimDays} days and we replace or refund it.` },
];

const QUICK = [
  { href: "/catalog/games", label: "Games" },
  { href: "/catalog/gift-cards", label: "Gift cards" },
  { href: "/catalog/subscriptions", label: "Subscriptions" },
];

function HeroFeature({ product }: { product: CatalogProduct }) {
  const face = productFace(product.name, product.key);
  const { add, inCart, openSheet, price } = useAddToCart(product);
  return (
    <div data-card="" className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 rounded-tray bg-raised p-5 shadow-lg max-sm:grid-cols-1 sm:p-6">
      <ProductCover src={product.images?.[0]?.url} alt={product.images?.[0]?.alt || face.title} priority sizes="(min-width: 1024px) 260px, 60vw" className="rounded-tray max-sm:mx-auto max-sm:w-2/3" />
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <KeyPlates face={face} className="mb-3" />
          <TypeLine face={face} />
          <p className="m-0 mt-1.5 font-display text-step-3 font-semibold leading-[1.02] text-ink">{face.title}</p>
          {face.detail ? <p className="m-0 mt-2 text-ui-sm text-ink-muted">{face.detail}</p> : null}
        </div>
        <div className="mt-auto border-t border-line pt-4">
          <PriceDisplay price={price} comparePrice={product.comparePrice ? Number(product.comparePrice) : null} size="md" />
        </div>
        <div className="flex flex-col gap-1">
          {inCart ? (
            <Button variant="outline" fullWidth onPress={openSheet}>
              In cart
            </Button>
          ) : (
            <Button fullWidth startContent={<Plus size={18} aria-hidden="true" />} onClick={(e: MouseEvent<HTMLElement>) => add(e.currentTarget.closest("[data-card]"))}>
              Add to cart
            </Button>
          )}
          <Link href={`/product/${product.slug}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            Platform, region and languages
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ liveCount, hero }: HeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <section aria-labelledby="hero-title" data-section="hero" className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-wide gap-x-6 gap-y-10 px-gutter pb-14 pt-10 lg:grid-cols-12 lg:items-center lg:pb-16 lg:pt-14">
        <div className="min-w-0 lg:col-span-6">
          <p className="eyebrow m-0">Game keys, subscriptions and gift cards</p>
          <h1 id="hero-title" className="m-0 mt-4 text-step-6 font-[720] leading-[0.92] tracking-[-0.015em] text-ink">
            Buy the key, redeem it on your platform.
          </h1>
          <p className="m-0 mt-5 max-w-[50ch] text-step-1 leading-[1.5] text-ink-muted">
            Every product lists its platform, activation region and languages before you pay. After your card payment is confirmed, the key is issued to your account.
          </p>
          <form
            role="search"
            className="mt-7 flex max-w-[560px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = query.trim();
              router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/catalog");
            }}
          >
            <label htmlFor="hero-search" className="sr-only">
              Search games and gift cards
            </label>
            <div className="relative min-w-0 flex-1">
              <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={liveCount > 0 ? `Search ${liveCount.toLocaleString("en-GB")} products` : "Search games"}
                autoComplete="off"
                className="h-14 w-full rounded-control border border-control bg-raised pl-12 pr-4 text-step-0 text-ink placeholder:text-ink-subtle hover-device:hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
            </div>
            <Button type="submit" size="lg" className="h-14">
              Search
            </Button>
          </form>
          <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-ui-md text-ink-muted">
            <span>Or go straight to</span>
            {QUICK.map((l) => (
              <Link key={l.href} href={l.href} className="min-h-10 py-2 font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                {l.label}
              </Link>
            ))}
          </p>
          <ul className="m-0 mt-8 grid list-none gap-0 border-t border-line p-0">
            {PROPS.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3 border-b border-line py-3">
                <Icon size={18} aria-hidden="true" className="mt-0.5 text-ink" />
                <p className="m-0 text-ui-md leading-[1.45] text-ink-muted">
                  <span className="font-semibold text-ink">{title}.</span> {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
        {hero ? (
          <div className="min-w-0 lg:col-span-6">
            <HeroFeature product={hero} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
