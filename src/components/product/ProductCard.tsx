"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { itemQuantityCap } from "@/lib/pricing";
import type { KeySummary } from "@/lib/keys/taxonomy";
import { ProductCover, type CoverAspect } from "./ProductCover";
import { productFace, type CatalogProduct, type ProductFace } from "./product-face";

export { productFace, type CatalogProduct, type ProductFace };

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function KeyPlates({ face, className }: { face: ProductFace; className?: string }) {
  if (!face.platform) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Plate variant="neutral">{face.platform}</Plate>
      {face.regionLocked && face.regionShort ? <Plate variant="neutral">{face.regionShort}</Plate> : null}
    </div>
  );
}

export function TypeLine({ face, className }: { face: ProductFace; className?: string }) {
  const parts = [face.typeLabel, face.region].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className={cn("eyebrow m-0 truncate tracking-[0.06em]", className)}>{parts.join(" · ")}</p>;
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
}

export function ProductCard({ product, variant = "standard", priority, sizes, headingLevel = 3, showCompare = true, className, aspect, readout, fill = false }: ProductCardProps) {
  const { isSaved, toggle, pending } = useWishlist();
  const { add, inCart, openSheet, price, imageUrl } = useAddToCart(product);
  const [adding, setAdding] = useState(false);
  const face = productFace(product.name, product.key);
  const compare = showCompare ? toNumber(product.comparePrice) : null;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const saved = isSaved(product.id);
  const feature = variant === "feature";
  const href = `/product/${product.slug}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const alt = product.images?.[0]?.alt || face.title;
  const few = product.quantity !== undefined && product.quantity > 0 && product.quantity <= 3 ? product.quantity : null;

  return (
    <article data-card="" data-lift="" data-variant={variant} className={cn("product-card group/card", fill && "h-full", outOfStock && "opacity-55", className)}>
      <ProductCover src={imageUrl} alt={alt} aspect={aspect ?? (feature ? "16/9" : "3/4")} priority={priority} sizes={sizes ?? (feature ? "(min-width: 1024px) 640px, 100vw" : undefined)} className={fill ? "lg:aspect-auto lg:min-h-[280px] lg:flex-1" : undefined}>
        <div className="absolute left-2.5 top-2.5 z-[5] flex flex-wrap gap-1.5 pr-12">
          {outOfStock ? <Plate variant="neutral">Out of stock</Plate> : null}
          <KeyPlates face={face} className="contents" />
        </div>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Saved: ${face.title}` : `Save ${face.title}`}
          disabled={pending(product.id)}
          className={cn(
            "absolute right-1.5 top-1.5 z-[5] flex size-11 cursor-pointer items-center justify-center rounded-control bg-raised/85 text-ink transition-opacity duration-[140ms] hover-device:size-9",
            saved ? "opacity-100" : "hover-device:opacity-0 hover-device:group-hover/card:opacity-100 hover-device:group-focus-within/card:opacity-100",
          )}
        >
          <Bookmark size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        </button>
      </ProductCover>

      <div className={cn("@container flex flex-col border-t border-line", !fill && "flex-1", feature ? "gap-3 p-5 sm:p-6" : "gap-2.5 px-4 pb-4 pt-3.5")}>
        <div className="min-w-0">
          <TypeLine face={face} />
          <Heading className={cn("m-0 mt-1 font-display font-semibold tracking-normal text-ink", feature ? "text-step-3 leading-[1.05]" : "text-step-1 leading-[1.12]")}>
            <Link
              href={href}
              data-card-link=""
              className={cn(
                "outline-none after:absolute after:inset-0 after:z-[2] hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4",
                !feature && "line-clamp-2 min-h-[2.24em] [overflow-wrap:anywhere]",
              )}
            >
              {face.title}
            </Link>
          </Heading>
          {face.detail ? <p className="m-0 mt-1 truncate text-ui-sm text-ink-muted">{face.detail}</p> : null}
        </div>
        {readout}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2.5 pt-1">
          <div className="flex min-w-0 flex-col gap-1">
            {outOfStock ? (
              <span className="font-mono text-data text-ink-muted">
                Last price <PriceDisplay price={price} size="sm" className="text-ink-muted" />
              </span>
            ) : (
              <PriceDisplay price={price} comparePrice={compare} size={feature ? "md" : "sm"} />
            )}
            {few ? <span className="font-mono text-[0.75rem] leading-none text-ink-muted">{few} left</span> : null}
          </div>
          {outOfStock ? null : inCart ? (
            <button
              type="button"
              onClick={openSheet}
              className="relative z-[3] inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 text-ui-sm font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
            >
              <Check size={16} aria-hidden="true" />
              In cart
            </button>
          ) : (
            <Button
              size={feature ? "md" : "sm"}
              variant="outline"
              isLoading={adding}
              onClick={(event: MouseEvent<HTMLElement>) => {
                setAdding(true);
                add(event.currentTarget.closest("[data-card]"));
                window.setTimeout(() => setAdding(false), 160);
              }}
              aria-label={`Add ${face.title} to cart`}
              startContent={<Plus size={16} aria-hidden="true" />}
              className="z-[3] shrink-0 @max-[11rem]:w-full group-hover/card:border-accent-edge group-hover/card:bg-brand group-hover/card:text-on-brand group-focus-within/card:border-accent-edge group-focus-within/card:bg-brand group-focus-within/card:text-on-brand"
            >
              Add
            </Button>
          )}
        </div>
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
  const coverWidth = size === "md" ? "w-[84px] sm:w-[104px]" : "w-[64px]";
  return (
    <div data-product-row="" className={cn("relative flex min-w-0 gap-4", className)}>
      <div className={cn("relative shrink-0 overflow-hidden rounded-tray", coverWidth)}>
        <ProductCover src={imageUrl} alt="" compact sizes={size === "md" ? "104px" : "64px"} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <TypeLine face={face} />
            <Heading className={cn("m-0 mt-0.5 font-display font-semibold leading-[1.15] tracking-normal text-ink", size === "md" ? "text-step-1" : "text-[1.0625rem]")}>
              {href ? (
                <Link href={href} className="line-clamp-2 decoration-1 underline-offset-4 hover-device:hover:underline">
                  {face.title}
                </Link>
              ) : (
                <span className="line-clamp-2">{face.title}</span>
              )}
            </Heading>
          </div>
          {aside ? <div className="shrink-0 text-right">{aside}</div> : null}
        </div>
        {keyInfo ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <KeyPlates face={face} />
            {face.detail ? <span className="text-ui-sm text-ink-muted">{face.detail}</span> : null}
          </div>
        ) : null}
        {meta}
        {children}
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ variant = "standard" }: { variant?: "standard" | "feature" }) {
  return (
    <div aria-hidden="true" className="product-card">
      <div className={cn("rounded-t-tray bg-surface-2", variant === "feature" ? "aspect-video" : "aspect-[3/4]")} />
      <div className="flex flex-col gap-3 border-t border-line px-4 pb-4 pt-3.5">
        <SkeletonBar className="w-16" />
        <SkeletonBar className="h-4 w-[70%]" />
        <SkeletonBar className="w-14" />
      </div>
    </div>
  );
}

export function CardGrid({ children, className, columns = 4 }: { children: ReactNode; className?: string; columns?: 3 | 4 | 5 }) {
  return (
    <div className={cn("grid min-w-0 grid-cols-2 gap-3 lg:gap-4", columns === 5 ? "lg:grid-cols-4 xl:grid-cols-5" : columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3", className)}>
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
