"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, CircleCheck, CircleHelp, LockKeyhole, Plus, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { SkinMarks, WeaponLine, skinFace, useAddToCart, type SkinProduct } from "@/components/skin/SkinTray";
import { useWishlist } from "@/providers/WishlistProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { EXTERIORS, floatRangeLabel, weaponTypeDef } from "@/lib/skins/cs2";

export interface ExteriorOption {
  code: string;
  slug: string | null;
  price: number | null;
  current: boolean;
}

export interface MarkSwitch {
  current: "standard" | "stattrak";
  standard: string | null;
  stattrak: string | null;
}

export interface SkinReadoutProps {
  product: SkinProduct;
  breadcrumbs?: ReactNode;
  exteriors: ExteriorOption[];
  markSwitch: MarkSwitch | null;
  weaponHref: string | null;
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-11 grid-cols-[132px_minmax(0,1fr)] items-center gap-4 border-b border-line py-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="m-0 text-ui-md text-ink">{children}</dd>
    </div>
  );
}

function ExteriorSwitch({ options }: { options: ExteriorOption[] }) {
  const { currency, convert } = useCurrency();
  if (options.filter((o) => o.slug).length < 2) return null;
  return (
    <nav aria-label="Other exteriors of this skin" className="mt-6">
      <p className="eyebrow m-0 mb-2">Exterior</p>
      <ul className="m-0 grid list-none grid-cols-5 overflow-hidden rounded-control border border-control p-0">
        {options.map((o, i) => {
          const def = EXTERIORS.find((e) => e.code === o.code);
          const body = (
            <>
              <span className="font-mono text-data font-semibold">{o.code}</span>
              <span className="font-mono text-[0.6875rem] leading-none">{o.price !== null ? formatPrice(convert(o.price), currency).replace(/\.\d\d$/, "") : "—"}</span>
            </>
          );
          const base = cn("flex h-14 flex-col items-center justify-center gap-1 text-center", i > 0 && "border-l border-line");
          return (
            <li key={o.code} className="min-w-0">
              {o.current ? (
                <span aria-current="true" className={cn(base, "bg-brand-soft text-ink shadow-[inset_0_-2px_0_var(--color-accent)]")}>
                  {body}
                  <span className="sr-only">{def?.label}, this listing</span>
                </span>
              ) : o.slug ? (
                <Link href={`/product/${o.slug}`} className={cn(base, "text-ink-muted transition-colors duration-[140ms] hover-device:hover:bg-raised hover-device:hover:text-ink")} aria-label={`${def?.label}${o.price !== null ? `, ${formatPrice(convert(o.price), currency)}` : ""}`}>
                  {body}
                </Link>
              ) : (
                <span className={cn(base, "text-ink-subtle")} aria-label={`${def?.label}, not in stock`}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MarkToggle({ value }: { value: MarkSwitch }) {
  const item = (key: "standard" | "stattrak", label: string) => {
    const slug = value[key];
    const active = value.current === key;
    const cls = cn("flex h-10 flex-1 items-center justify-center px-3 text-ui-sm font-semibold", key === "stattrak" && "border-l border-line");
    if (active)
      return (
        <span aria-current="true" className={cn(cls, "bg-brand-soft text-ink shadow-[inset_0_-2px_0_var(--color-accent)]")}>
          {label}
        </span>
      );
    if (!slug) return null;
    return (
      <Link href={`/product/${slug}`} className={cn(cls, "text-ink-muted hover-device:hover:bg-raised hover-device:hover:text-ink")}>
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label="StatTrak™ version" className="mt-3 flex overflow-hidden rounded-control border border-control">
      {item("standard", "Standard")}
      {item("stattrak", "StatTrak™")}
    </nav>
  );
}

export function SkinReadout({ product, breadcrumbs, exteriors, markSwitch, weaponHref }: SkinReadoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggle, pending } = useWishlist();
  const { add, inCart, openSheet, price } = useAddToCart(product);
  const [barVisible, setBarVisible] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const face = skinFace(product.name, product.skin);
  const skin = product.skin;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const saved = isSaved(product.id);
  const range = skin ? floatRangeLabel(skin.floatMin, skin.floatMax) : null;
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

  const addFrom = (e: MouseEvent<HTMLElement>) => add(e.currentTarget.closest("[data-product]")?.querySelector("[data-scene=inspect]") ?? null);
  const buyNow = (e: MouseEvent<HTMLElement>) => {
    if (!inCart) add(e.currentTarget.closest("[data-product]")?.querySelector("[data-scene=inspect]") ?? null);
    router.push("/checkout");
  };

  return (
    <div data-rarity={face.rarity} className="flex flex-col">
      {breadcrumbs}
      <SkinMarks face={face} className="mb-3" />
      <WeaponLine face={face} />
      <h1 className="m-0 mt-2 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">{face.name}</h1>

      <dl className="m-0 mt-6 border-t border-line">
        <SpecRow label="Exterior">
          {face.exteriorCode ? (
            <>
              {face.exteriorLabel} {range ? <span className="font-mono text-data text-ink-muted">({range})</span> : null}
            </>
          ) : (
            "Not painted"
          )}
        </SpecRow>
        {face.rarityLabel ? (
          <SpecRow label="Rarity">
            <Plate variant="rarity">{face.rarityLabel}</Plate>
          </SpecRow>
        ) : null}
        {skin ? <SpecRow label="Weapon">{skin.weapon}</SpecRow> : null}
        {skin ? <SpecRow label="Type">{weaponTypeDef(skin.weaponType)?.singular ?? skin.weaponType}</SpecRow> : null}
        {skin?.phase ? <SpecRow label="Phase">{skin.phase}</SpecRow> : null}
        {skin?.collection ? <SpecRow label="Collection">{skin.collection}</SpecRow> : null}
        {skin?.isStatTrak ? (
          <SpecRow label="StatTrak™">
            <span className="text-mark-stattrak">Yes</span> <span className="text-ink-muted">· Counts kills made with this weapon</span>
          </SpecRow>
        ) : null}
        {skin?.isSouvenir ? (
          <SpecRow label="Souvenir">
            <span className="text-mark-souvenir">Yes</span> <span className="text-ink-muted">· Dropped from a CS2 Major souvenir package</span>
          </SpecRow>
        ) : null}
      </dl>

      <ExteriorSwitch options={exteriors} />
      {markSwitch ? <MarkToggle value={markSwitch} /> : null}

      <div className="mt-7 flex items-end justify-between gap-4">
        {outOfStock ? (
          <span className="flex items-baseline gap-2 font-mono text-data text-ink-muted">
            Last price <PriceDisplay price={price} size="sm" />
          </span>
        ) : (
          <PriceDisplay price={price} size="lg" />
        )}
        {!outOfStock && product.quantity !== undefined && product.quantity <= 3 ? (
          <span className="font-mono text-[0.75rem] text-ink-muted">{product.quantity} available</span>
        ) : null}
      </div>

      <div ref={actionRef} data-action="" className="mt-4 flex flex-col gap-3">
        {outOfStock ? (
          <>
            <Button size="lg" isDisabled fullWidth>
              Out of stock
            </Button>
            <p className="m-0 text-ui-md text-ink-muted">
              This exact skin isn&apos;t in stock right now.{" "}
              {weaponHref ? (
                <Link href={weaponHref} className="font-semibold text-ink underline decoration-1 underline-offset-4">
                  See other {skin?.weapon ?? ""} skins
                </Link>
              ) : null}
            </p>
          </>
        ) : inCart ? (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" onPress={openSheet} startContent={<Check size={18} aria-hidden="true" />}>
              In cart
            </Button>
            <Button size="lg" as={Link} href="/checkout">
              Checkout
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={addFrom} startContent={<Plus size={18} aria-hidden="true" />}>
              Add to cart
            </Button>
            <Button size="lg" variant="outline" onClick={buyNow}>
              Buy now
            </Button>
          </div>
        )}
        {!user && !outOfStock ? <p className="m-0 text-ui-sm text-ink-muted">You sign in through Steam at checkout, so we know which account to send it to.</p> : null}
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
          {["Pay by card", "We send a Steam trade offer", "Accept it in Steam"].map((step) => (
            <li key={step} className="relative pt-5">
              <span aria-hidden="true" className="absolute left-0 top-0 size-[9px] rounded-full border border-ink bg-surface" />
              <span className="block text-ui-sm leading-[1.35] text-ink">{step}</span>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-3 text-ui-sm text-ink-muted">
          We send the offer {d.usualTime}. Steam may place items you receive under trade protection for up to {d.tradeProtectionDays} days; that is Steam’s rule, not ours.
        </p>
      </section>

      <ul className="m-0 mt-5 list-none border-t border-line p-0">
        <li className="flex items-start gap-3 border-b border-line py-3">
          <Repeat2 size={18} aria-hidden="true" className="mt-0.5 text-ink" />
          <p className="m-0 text-ui-md text-ink">Delivered as a Steam trade offer to your trade URL.</p>
        </li>
        <li className="flex items-start gap-3 border-b border-line py-3">
          <CircleCheck size={18} aria-hidden="true" className="mt-0.5 text-ink" />
          <p className="m-0 text-ui-md text-ink">
            {STORE_POLICY.guarantee.summary}{" "}
            <Link href="/policies/warranty" className="font-semibold underline decoration-1 underline-offset-4">
              Item guarantee
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
            <p className="m-0 truncate text-ui-sm text-ink-muted">{face.name}</p>
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
