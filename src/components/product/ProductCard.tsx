"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, Pin, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Plate } from "@/components/ui/Plate";
import { DialLoader } from "@/components/ui/Dial";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { itemQuantityCap } from "@/lib/pricing";
import type { KeySummary } from "@/lib/keys/taxonomy";
import { Cover, COVER_SIZES, type CoverAspect } from "./Cover";
import { productFace, type CatalogProduct, type ProductFace } from "./product-face";

export { productFace, type CatalogProduct, type ProductFace };

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function LabelRow({ face, size = "sm", edition = false, extra, className }: { face: ProductFace; size?: "sm" | "md"; edition?: boolean; extra?: ReactNode; className?: string }) {
  if (!face.platform) return null;
  const spoken = [`Activates on ${face.platformShort}.`, `Region: ${face.region ?? face.regionTag}.`, face.kind === "game" ? null : `${face.typeSentence}.`, edition && face.edition ? `${face.edition}.` : null].filter(Boolean).join(" ");
  const md = size === "md";
  return (
    <p data-label-row="" data-platform={face.tone} data-type={face.typeTone} className={cn("m-0 flex min-w-0 flex-wrap items-center gap-y-1.5", md ? "gap-x-2.5 text-[0.875rem]" : "gap-x-2 text-[0.6875rem] sm:text-[0.75rem]", className)}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className={cn("flex min-w-0 max-w-full items-center", md ? "gap-2.5" : "gap-1.5 sm:gap-2")}>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn("shrink-0 bg-platform", md ? "size-2" : "size-1.5")} />
          <span className="eyebrow truncate leading-none text-ink [font-size:inherit]">{face.platformShort}</span>
        </span>
        <span className="font-mono leading-none text-ink-subtle">·</span>
        <span className="min-w-0 shrink truncate font-mono font-medium uppercase leading-none text-ink">{face.regionTag}</span>
        {face.typeTag ? (
          <>
            <span className="font-mono leading-none text-ink-subtle">·</span>
            <span className="eyebrow shrink-0 leading-none text-type [font-size:inherit]">{face.typeTag}</span>
          </>
        ) : null}
      </span>
      {edition && face.edition ? (
        <span aria-hidden="true" className="shrink-0">
          <Plate variant="edition" size="sm">
            {face.edition}
          </Plate>
        </span>
      ) : null}
      {extra}
    </p>
  );
}

export function KeyPlates({ face, className }: { face: ProductFace; className?: string }) {
  return <LabelRow face={face} className={className} />;
}

export function TypeLine({ face, className }: { face: ProductFace; className?: string }) {
  return <LabelRow face={face} className={className} />;
}

export function useAddToCart(product: CatalogProduct) {
  const { addItem, cart, openSheet } = useCart();
  const price = toNumber(product.price) ?? 0;
  const imageUrl = product.imageUrl ?? product.images?.[0]?.url ?? null;
  const inCart = cart.items.some((item) => item.productId === product.id);
  const add = (source?: Element | null, quantity = 1) => {
    window.dispatchEvent(new CustomEvent("keyrook:cart-add", { detail: { productId: product.id, source: source ?? null } }));
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? product.id,
      price,
      quantity,
      imageUrl,
      maxQuantity: itemQuantityCap(product.quantity, product.key?.productType),
      key: product.key ?? undefined,
    });
  };
  return { add, inCart, openSheet, price, imageUrl };
}

function PinButton({ productId, title, className }: { productId: string; title: string; className?: string }) {
  const { isSaved, toggle, pending } = useWishlist();
  const pinned = isSaved(productId);
  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={pinned}
      aria-label={pinned ? `Pinned: ${title}` : `Pin ${title}`}
      disabled={pending(productId)}
      className={cn(
        "relative z-[3] flex size-10 shrink-0 cursor-pointer items-center justify-center transition-colors duration-[120ms] touch-device:size-11 hover-device:hover:bg-raised disabled:cursor-wait",
        pinned ? "text-ink" : "text-ink-muted hover-device:hover:text-ink",
        className,
      )}
    >
      <Pin size={18} aria-hidden="true" fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}

export interface ProductCardProps {
  product: CatalogProduct;
  variant?: "standard" | "feature";
  priority?: boolean;
  sizes?: string;
  headingLevel?: 2 | 3 | 4;
  showCompare?: boolean;
  className?: string;
  aspect?: CoverAspect;
  readout?: ReactNode;
  fill?: boolean;
  demo?: boolean;
  demoId?: string;
}

export function ProductCard({ product, variant = "standard", priority, sizes, headingLevel = 3, showCompare = true, className, aspect, readout, demo = false, demoId }: ProductCardProps) {
  if (variant === "feature") return <FeatureBox product={product} priority={priority} headingLevel={headingLevel} className={className} />;
  return <DepositBox product={product} priority={priority} sizes={sizes} headingLevel={headingLevel} showCompare={showCompare} className={className} aspect={aspect} readout={readout} demo={demo} demoId={demoId} />;
}

function AddControl({ product, title, onAdd, adding }: { product: CatalogProduct; title: string; onAdd: (e: MouseEvent<HTMLElement>) => void; adding: boolean }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${title} to cart`}
      aria-busy={adding || undefined}
      data-add=""
      data-product-id={product.id}
      className={cn(
        "relative z-[3] flex size-10 shrink-0 cursor-pointer items-center justify-center border border-control bg-plate text-ink shadow-machined transition-[background-color,border-color,color,transform] duration-[120ms] touch-device:size-11",
        "active:translate-y-px active:shadow-machined-pressed",
        "hover-device:group-hover/box:border-accent-edge hover-device:group-hover/box:bg-brand hover-device:group-hover/box:text-on-brand",
        "group-focus-within/box:border-accent-edge group-focus-within/box:bg-brand group-focus-within/box:text-on-brand",
      )}
    >
      {adding ? <DialLoader size={16} label="Adding" /> : <SquarePlus size={18} aria-hidden="true" />}
    </button>
  );
}

export function DepositBox({
  product,
  priority,
  sizes,
  headingLevel = 3,
  showCompare = true,
  className,
  aspect,
  readout,
  demo = false,
  demoId,
}: Omit<ProductCardProps, "variant" | "fill">) {
  const { add, inCart, openSheet, price, imageUrl } = useAddToCart(product);
  const [adding, setAdding] = useState(false);
  const face = productFace(product.name, product.key);
  const compare = showCompare ? toNumber(product.comparePrice) : null;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const href = `/product/${product.slug}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const onAdd = (event: MouseEvent<HTMLElement>) => {
    if (demo) return;
    setAdding(true);
    add(event.currentTarget.closest("[data-card]"));
    window.setTimeout(() => setAdding(false), 160);
  };

  const title = demo ? (
    <span data-card-link="" className="line-clamp-2 min-h-[2.6em] [overflow-wrap:anywhere]">
      {face.title}
    </span>
  ) : (
    <Link href={href} data-card-link="" className="line-clamp-2 min-h-[2.6em] outline-none [overflow-wrap:anywhere] after:absolute after:inset-0 after:z-[2]">
      {face.title}
    </Link>
  );

  return (
    <article
      data-card=""
      data-drawer=""
      data-platform={face.tone}
      data-type={face.typeTone}
      data-demo={demoId}
      data-stock={outOfStock ? "out" : "in"}
      className={cn("deposit-box group/box", className)}
    >
      <div data-drawer-face="" className="mx-2 mt-2">
        <Cover
          src={imageUrl}
          alt={`${face.title} cover art`}
          aspect={aspect ?? "3/4"}
          priority={priority}
          sizes={sizes ?? COVER_SIZES.card}
          platformLabel={face.platformShort}
          className={cn(outOfStock && "opacity-55")}
        />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
        <LabelRow face={face} extra={outOfStock ? <Plate variant="neutral" size="sm" className="ml-auto">Out of stock</Plate> : null} />
        <Heading className="m-0 mt-2 font-sans text-step-0 font-[640] leading-[1.3] tracking-normal text-ink [font-stretch:100%]">{title}</Heading>
        <p className="m-0 mt-1 min-h-[1.4em] truncate font-mono text-[0.75rem] leading-[1.4] text-ink-muted">{face.facts ?? ""}</p>
        {readout}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {outOfStock ? (
              <span className="flex flex-col gap-0.5">
                <span className="text-ui-xs text-ink-muted">Last price</span>
                <PriceDisplay price={price} size="sm" className="[&_[data-price]]:text-ink-muted" />
              </span>
            ) : (
              <PriceDisplay price={price} comparePrice={compare} size="sm" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {demo ? null : <PinButton productId={product.id} title={face.title} className="max-sm:hidden" />}
            {outOfStock ? null : inCart && !demo ? (
              <button type="button" onClick={openSheet} className="btn-text relative z-[3] inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 px-1 text-ui-sm font-[560] text-ink">
                <Check size={16} aria-hidden="true" />
                <span data-label="">In cart</span>
              </button>
            ) : (
              <AddControl product={product} title={face.title} onAdd={onAdd} adding={adding} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeatureBox({ product, priority, headingLevel = 3, className }: { product: CatalogProduct; priority?: boolean; headingLevel?: 2 | 3 | 4; className?: string }) {
  const { add, inCart, openSheet, price, imageUrl } = useAddToCart(product);
  const [adding, setAdding] = useState(false);
  const face = productFace(product.name, product.key);
  const compare = toNumber(product.comparePrice);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const shot = product.screenshotUrl ?? null;
  return (
    <article data-card="" data-drawer="" data-feature="" data-platform={face.tone} data-type={face.typeTone} className={cn("deposit-box group/box", className)}>
      <div data-drawer-face="" className="relative mx-2 mt-2">
        {shot ? (
          <Cover src={shot} alt={`${face.title} screenshot 1`} aspect="16/9" fit="cover" priority={priority} sizes="(min-width: 1024px) 640px, 100vw" />
        ) : (
          <Cover src={imageUrl} alt={`${face.title} cover art`} aspect="16/9" fit="contain" priority={priority} sizes="(min-width: 1024px) 640px, 100vw" platformLabel={face.platformShort} />
        )}
        {shot ? (
          <div className="absolute bottom-3 left-3 z-[2] w-[34%] p-1.5 bg-plate shadow-machined">
            <Cover src={imageUrl} alt={`${face.title} cover art`} aspect="3/4" sizes="220px" platformLabel={face.platformShort} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4 sm:px-5">
        <LabelRow face={face} size="md" edition />
        <Heading className="m-0 text-step-3 leading-[1.08] text-ink">
          <Link href={`/product/${product.slug}`} data-card-link="" className="outline-none after:absolute after:inset-0 after:z-[2]">
            {face.title}
          </Link>
        </Heading>
        {face.facts ? <p className="m-0 font-mono text-[0.8125rem] text-ink-muted">{face.facts}</p> : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <PriceDisplay price={price} comparePrice={compare} size="lg" layout="inline" />
          <div className="flex items-center gap-1">
            <PinButton productId={product.id} title={face.title} />
            {inCart ? (
              <button type="button" onClick={openSheet} className="btn-text relative z-[3] inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-ui-sm font-[560] text-ink">
                <Check size={16} aria-hidden="true" />
                <span data-label="">In cart</span>
              </button>
            ) : (
              <AddControl
                product={product}
                title={face.title}
                adding={adding}
                onAdd={(e) => {
                  setAdding(true);
                  add(e.currentTarget.closest("[data-card]"));
                  window.setTimeout(() => setAdding(false), 160);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function GiftCardBlank({ product, denominations, className }: { product: CatalogProduct; denominations?: { label: string; href: string }[]; className?: string }) {
  const face = productFace(product.name, product.key);
  return (
    <article data-giftcard="" data-platform={face.tone} data-type="giftcard" className={cn("plate relative flex aspect-[1.586/1] flex-col justify-between p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 bg-platform" />
          <span className="eyebrow text-ink">{face.platformShort}</span>
        </p>
        <span className="eyebrow text-type">{face.typeTag ?? "Gift card"}</span>
      </div>
      {denominations?.length ? (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {denominations.map((d) => (
            <li key={d.href}>
              <Link href={d.href} className="label-caps inline-flex h-9 items-center border border-control bg-plate px-3 font-mono text-[0.8125rem] normal-case tracking-normal text-ink shadow-machined [font-stretch:100%] hover-device:hover:border-ink">
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-end justify-between gap-3">
        <Link href={`/product/${product.slug}`} className="price text-step-4 leading-none text-ink">
          {face.value ?? face.title}
        </Link>
        <span className="font-mono text-[0.75rem] font-medium uppercase text-ink">{face.regionTag}</span>
      </div>
    </article>
  );
}

export interface ProductRowProps {
  name: string;
  href?: string | null;
  imageUrl?: string | null;
  keyInfo?: KeySummary | null;
  meta?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md";
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function ProductRow({ name, href, imageUrl, keyInfo, meta, aside, children, size = "sm", headingLevel = 3, className }: ProductRowProps) {
  const face = productFace(name, keyInfo);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const coverWidth = size === "md" ? "w-[90px]" : "w-[60px]";
  return (
    <div data-product-row="" data-platform={face.tone} data-type={face.typeTone} className={cn("relative flex min-w-0 gap-4", className)}>
      <div className={cn("relative shrink-0", coverWidth)}>
        <Cover src={imageUrl} alt="" compact sizes={size === "md" ? "90px" : COVER_SIZES.row} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Heading className={cn("m-0 min-w-0 font-sans font-[640] leading-[1.3] tracking-normal text-ink [font-stretch:100%]", size === "md" ? "text-step-1" : "text-step-0")}>
            {href ? (
              <Link href={href} className={cn("decoration-1 underline-offset-4 hover-device:hover:underline", size === "md" ? "line-clamp-2" : "line-clamp-1")}>
                {face.title}
              </Link>
            ) : (
              <span className={size === "md" ? "line-clamp-2" : "line-clamp-1"}>{face.title}</span>
            )}
          </Heading>
          {aside ? <div className="shrink-0 text-right">{aside}</div> : null}
        </div>
        {keyInfo ? <LabelRow face={face} edition={size === "md"} /> : null}
        {size === "md" && face.facts ? <p className="m-0 font-mono text-[0.75rem] text-ink-muted">{face.facts}</p> : null}
        {meta}
        {children}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="deposit-box">
      <div className="mx-2 mt-2 aspect-[3/4] bg-surface-2" />
      <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
        <SkeletonBar className="w-[72px]" />
        <SkeletonBar className="h-4 w-[80%]" />
        <SkeletonBar className="mt-3 h-5 w-16" />
      </div>
    </div>
  );
}

export function CardGrid({ children, className, columns = 4 }: { children: ReactNode; className?: string; columns?: 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-2 gap-2.5 lg:gap-4",
        columns === 5 ? "min-[840px]:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : columns === 4 ? "min-[840px]:grid-cols-3 xl:grid-cols-4" : "min-[840px]:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 | 5 }) {
  return (
    <CardGrid columns={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </CardGrid>
  );
}
