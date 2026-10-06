"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ArrowRight, CircleCheck, CreditCard, Plus, Repeat2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { SkinStage } from "@/components/skin/SkinStage";
import { CalibratedRuler, exteriorReadout } from "@/components/skin/FloatRuler";
import { SkinMarks, WeaponLine, skinFace, useAddToCart, type SkinProduct } from "@/components/skin/SkinTray";

export interface HeroProps {
  liveCount: number;
  hero: SkinProduct | null;
}

const PROPS = [
  { Icon: Repeat2, title: "Sent to your Steam inventory", body: "Delivered as a Steam trade offer after your payment is confirmed." },
  { Icon: CreditCard, title: "The price you see is what you pay", body: "No fees added at checkout. Prices are re-confirmed before you pay." },
  { Icon: CircleCheck, title: "Refunded if we can't deliver", body: "If we can't deliver an item you paid for, you get the full price back." },
];

function HeroReadout({ product }: { product: SkinProduct }) {
  const face = skinFace(product.name, product.skin);
  const { add, inCart, openSheet, price } = useAddToCart(product);
  return (
    <div data-depth="4" data-hero-readout="" data-rarity={face.rarity} className="relative flex flex-col gap-4 rounded-tray bg-raised p-5 shadow-lg sm:p-6">
      <div>
        <WeaponLine face={face} />
        <p className="m-0 mt-1.5 font-display text-step-3 font-semibold leading-[1.02] text-ink">{face.name}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {face.rarityLabel ? <Plate variant="rarity">{face.rarityLabel}</Plate> : null}
        <SkinMarks face={face} className="contents" />
      </div>
      {face.exteriorCode ? (
        <CalibratedRuler lit={[face.exteriorCode]} labels={false} minor={false} draw readout={exteriorReadout(face.exteriorCode)} />
      ) : (
        <p className="m-0 font-mono text-data text-ink">Not painted</p>
      )}
      <div className="border-t border-line pt-4">
        <PriceDisplay price={price} size="md" />
      </div>
      <div className="flex flex-col gap-1">
        {inCart ? (
          <Button variant="outline" fullWidth onPress={openSheet}>
            In cart
          </Button>
        ) : (
          <Button fullWidth startContent={<Plus size={18} aria-hidden="true" />} onClick={(e: MouseEvent<HTMLElement>) => add(e.currentTarget.closest("[data-scene]"))}>
            Add to cart
          </Button>
        )}
        <Link href={`/product/${product.slug}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
          Inspect this skin
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function HomeHero({ liveCount, hero }: HeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const face = hero ? skinFace(hero.name, hero.skin) : null;

  return (
    <section aria-labelledby="hero-title" data-scene="bay-hero" data-section="hero" className="relative overflow-hidden">
      <div data-hero-pin="" className="relative mx-auto grid max-w-wide gap-x-6 gap-y-10 px-gutter pb-14 pt-10 lg:min-h-[calc(100svh-var(--header-height))] lg:grid-cols-12 lg:items-center lg:pb-16 lg:pt-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="eyebrow m-0">CS2 skin store</p>
          <h1 id="hero-title" data-anim="words" className="m-0 mt-4 text-step-6 font-[720] leading-[0.92] tracking-[-0.015em] text-ink lg:text-[clamp(3.5rem,1.2rem+5.4vw,7.5rem)] lg:leading-[0.9]">
            Every skin, under the lamp.
          </h1>
          <p className="m-0 mt-5 max-w-[46ch] text-step-1 leading-[1.5] text-ink-muted">
            Counter-Strike 2 skins with exterior, rarity and price in plain view. Pay by card and we send the skin to your Steam account as a trade offer.
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
              Search skins
            </label>
            <div className="relative min-w-0 flex-1">
              <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${liveCount.toLocaleString("en-GB")} skins`}
                autoComplete="off"
                className="h-14 w-full rounded-control border border-control bg-raised pl-12 pr-4 text-step-0 text-ink shadow-lamp-catch placeholder:text-ink-subtle hover-device:hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
            </div>
            <Button type="submit" size="lg" className="h-14">
              Search
            </Button>
          </form>
          <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-ui-md text-ink-muted">
            <span>Or go straight to</span>
            {[
              { href: "/catalog/knives", label: "Knives" },
              { href: "/catalog/gloves", label: "Gloves" },
              { href: "/catalog/rifles", label: "Rifles" },
            ].map((l) => (
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

        {hero && face ? (
          <div className="relative min-w-0 lg:col-span-7 lg:pb-10">
            <div aria-hidden="true" data-depth="0" data-horizon="" className="pointer-events-none absolute -right-[50vw] left-[-6%] top-[72%] hidden h-px bg-line lg:block" />
            <div data-hero-dolly="" className="relative">
              <article data-tray="" data-tilt="8" data-depth="2" data-rarity={face.rarity} className="tray lg:w-[calc(100%-240px)]">
                <SkinStage src={hero.images?.[0]?.url} alt={hero.images?.[0]?.alt || hero.name} aspect="16/10" priority sizes="(min-width: 1024px) 720px, 100vw" viewTransition={`render-${hero.id}`}>
                  <div data-lamp="webgl" aria-hidden="true" className="absolute inset-0 z-[2]" />
                </SkinStage>
              </article>
              <div className="mt-3 lg:absolute lg:right-0 lg:top-1/2 lg:mt-0 lg:w-[300px] lg:-translate-y-1/2">
                <HeroReadout product={hero} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
