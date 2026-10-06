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
import type { SkinSummary } from "@/lib/skins/cs2";
import { skinFace, type SkinFace, type SkinProduct } from "./face";

export { skinFace, type SkinFace, type SkinProduct };
import { SkinStage, type StageAspect } from "./SkinStage";
import { StarMark } from "./StarMark";
import { ZoneStrip } from "./FloatRuler";

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function SkinMarks({ face, max = 3, className }: { face: SkinFace; max?: number; className?: string }) {
  const marks: ReactNode[] = [];
  if (face.stattrak) marks.push(<Plate key="st" variant="stattrak">StatTrak™</Plate>);
  if (face.souvenir) marks.push(<Plate key="sv" variant="souvenir">Souvenir</Plate>);
  if (face.phase) marks.push(<Plate key="ph" variant="phase">{face.phase}</Plate>);
  if (marks.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{marks.slice(0, max)}</div>;
}

export function WeaponLine({ face, className }: { face: SkinFace; className?: string }) {
  return (
    <p className={cn("eyebrow m-0 flex min-w-0 items-center gap-1.5 tracking-[0.06em]", className)}>
      {face.star ? <StarMark size={10} label /> : null}
      <span className="truncate">{face.weaponLine}</span>
    </p>
  );
}

export function ExteriorLine({ face, className }: { face: SkinFace; className?: string }) {
  return (
    <p className={cn("m-0 flex min-w-0 items-center gap-2", className)}>
      <ZoneStrip exterior={face.exteriorCode} />
      {face.exteriorCode ? <span className="font-mono text-[0.75rem] leading-none text-ink">{face.exteriorCode}</span> : null}
      <span className="truncate text-ui-sm leading-none text-ink-muted @max-[11rem]:hidden">{face.exteriorLabel}</span>
    </p>
  );
}

export function useAddToCart(product: SkinProduct) {
  const { addItem, cart, openSheet } = useCart();
  const price = toNumber(product.price) ?? 0;
  const imageUrl = product.imageUrl ?? product.images?.[0]?.url ?? null;
  const inCart = cart.items.some((item) => item.productId === product.id);
  const add = (source?: Element | null) => {
    window.dispatchEvent(new CustomEvent("patina:cart-add", { detail: { productId: product.id, source: source ?? null } }));
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? product.id,
      price,
      quantity: 1,
      imageUrl,
      maxQuantity: itemQuantityCap(product.quantity),
      skin: product.skin ?? undefined,
    });
  };
  return { add, inCart, openSheet, price, imageUrl };
}

export interface SkinTrayProps {
  product: SkinProduct;
  variant?: "standard" | "feature";
  priority?: boolean;
  sizes?: string;
  headingLevel?: 2 | 3 | 4;
  showCompare?: boolean;
  tilt?: number;
  className?: string;
  stageAspect?: StageAspect;
  readout?: ReactNode;
  fill?: boolean;
}

export function SkinTray({ product, variant = "standard", priority, sizes, headingLevel = 3, showCompare = false, tilt, className, stageAspect, readout, fill = false }: SkinTrayProps) {
  const { isSaved, toggle, pending } = useWishlist();
  const { add, inCart, openSheet, price, imageUrl } = useAddToCart(product);
  const [adding, setAdding] = useState(false);
  const face = skinFace(product.name, product.skin, product.category);
  const compare = showCompare ? toNumber(product.comparePrice) : null;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const saved = isSaved(product.id);
  const feature = variant === "feature";
  const href = `/product/${product.slug}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const alt = product.images?.[0]?.alt || product.name;
  const available = product.quantity !== undefined && product.quantity > 0 && product.quantity <= 3 ? product.quantity : null;
  const describe = [face.rarityLabel, face.exteriorLabel].filter(Boolean).join(", ");
  const descId = `tray-${product.id}-desc`;

  return (
    <article
      data-tray=""
      data-lift=""
      data-variant={variant}
      data-tilt={tilt ?? (feature ? 8 : 4)}
      data-depth="2"
      data-rarity={face.rarity}
      aria-describedby={describe ? descId : undefined}
      className={cn("tray group/tray", fill && "h-full", outOfStock && "opacity-55", className)}
    >
      {describe ? (
        <span id={descId} className="sr-only">
          {describe}
        </span>
      ) : null}
      <SkinStage
        src={imageUrl}
        alt={alt}
        aspect={stageAspect ?? (feature ? "16/10" : "4/3")}
        priority={priority}
        sizes={sizes ?? (feature ? "(min-width: 1024px) 640px, 100vw" : undefined)}
        viewTransition={`render-${product.id}`}
        className={fill ? "lg:aspect-auto lg:min-h-[280px] lg:flex-1" : undefined}
      >
        <div className="absolute left-2.5 top-2.5 z-[5] flex flex-wrap gap-1.5 pr-12">
          {outOfStock ? <Plate variant="neutral">Out of stock</Plate> : null}
          <SkinMarks face={face} className="contents" />
        </div>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Saved: ${product.name}` : `Save ${product.name}`}
          disabled={pending(product.id)}
          className={cn(
            "absolute right-1.5 top-1.5 z-[5] flex size-11 cursor-pointer items-center justify-center rounded-control text-ink transition-opacity duration-[140ms] hover-device:size-9 hover-device:hover:bg-raised",
            saved ? "opacity-100" : "hover-device:opacity-0 hover-device:group-hover/tray:opacity-100 hover-device:group-focus-within/tray:opacity-100",
          )}
        >
          <Bookmark size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        </button>
      </SkinStage>

      <div className={cn("@container flex flex-col border-t border-line", !fill && "flex-1", feature ? "gap-3 p-5 sm:p-6" : "gap-2.5 px-4 pb-4 pt-3.5")}>
        <div className="min-w-0">
          <WeaponLine face={face} />
          <Heading className={cn("m-0 mt-1 font-display font-semibold tracking-normal text-ink", feature ? "text-step-3 leading-[1.05]" : "text-step-1 leading-[1.12]")}>
            <Link
              href={href}
              data-tray-link=""
              className={cn(
                "outline-none after:absolute after:inset-0 after:z-[2] hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4",
                !feature && "line-clamp-2 min-h-[2.24em] [overflow-wrap:anywhere]",
              )}
            >
              {face.name}
            </Link>
          </Heading>
        </div>
        {product.skin ? <ExteriorLine face={face} /> : null}
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
            {available ? <span className="font-mono text-[0.75rem] leading-none text-ink-muted">{available} available</span> : null}
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
                add(event.currentTarget.closest("[data-tray]"));
                window.setTimeout(() => setAdding(false), 160);
              }}
              aria-label={`Add ${product.name} to cart`}
              startContent={<Plus size={16} aria-hidden="true" />}
              className="z-[3] shrink-0 @max-[11rem]:w-full group-hover/tray:border-accent-edge group-hover/tray:bg-brand group-hover/tray:text-on-brand group-focus-within/tray:border-accent-edge group-focus-within/tray:bg-brand group-focus-within/tray:text-on-brand"
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export interface SkinRowProps {
  name: string;
  href?: string | null;
  imageUrl?: string | null;
  skin?: SkinSummary | null;
  fallbackLine?: string | null;
  meta?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md";
  headingLevel?: 2 | 3 | 4;
  showRarity?: boolean;
  className?: string;
}

export function SkinRow({ name, href, imageUrl, skin, fallbackLine, meta, aside, children, size = "sm", headingLevel = 3, showRarity = true, className }: SkinRowProps) {
  const face = skinFace(name, skin, fallbackLine);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const stageWidth = size === "md" ? "w-[120px] sm:w-[160px]" : "w-[96px]";
  return (
    <div data-skin-row="" data-rarity={face.rarity} className={cn("group/tray relative flex min-w-0 gap-4", className)}>
      <div className={cn("relative shrink-0 overflow-hidden rounded-tray", stageWidth)}>
        <SkinStage src={imageUrl} alt="" compact sizes={size === "md" ? "160px" : "96px"} follow={false} />
        <span aria-hidden="true" className="absolute inset-y-0 left-0 z-[4] w-[3px] bg-rarity" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {face.weaponLine ? <WeaponLine face={face} /> : null}
            <Heading className={cn("m-0 mt-0.5 font-display font-semibold leading-[1.15] tracking-normal text-ink", size === "md" ? "text-step-1" : "text-[1.0625rem]")}>
              {href ? (
                <Link href={href} className="line-clamp-2 decoration-1 underline-offset-4 hover-device:hover:underline">
                  {face.name}
                </Link>
              ) : (
                <span className="line-clamp-2">{face.name}</span>
              )}
            </Heading>
          </div>
          {aside ? <div className="shrink-0 text-right">{aside}</div> : null}
        </div>
        {skin ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ExteriorLine face={face} />
            {showRarity && face.rarityLabel ? <Plate variant="rarity">{face.rarityLabel}</Plate> : null}
            <SkinMarks face={face} />
          </div>
        ) : null}
        {meta}
        {children}
      </div>
    </div>
  );
}

export function SkinTraySkeleton({ variant = "standard" }: { variant?: "standard" | "feature" }) {
  return (
    <div aria-hidden="true" className="tray [--rarity:var(--color-border)]">
      <div className={cn("rounded-t-tray bg-surface-2", variant === "feature" ? "aspect-[16/10]" : "aspect-[4/3]")} />
      <div className="flex flex-col gap-3 border-t border-line px-4 pb-4 pt-3.5">
        <SkeletonBar className="w-16" />
        <SkeletonBar className="h-4 w-[70%]" />
        <SkeletonBar className="w-14" />
      </div>
    </div>
  );
}

export function SkinGrid({ children, className, columns = 4 }: { children: ReactNode; className?: string; columns?: 3 | 4 }) {
  return (
    <div className={cn("grid min-w-0 grid-cols-2 gap-3 lg:gap-4", columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3", className)}>
      {children}
    </div>
  );
}

export function SkinGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <SkinGrid columns={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <SkinTraySkeleton key={i} />
      ))}
    </SkinGrid>
  );
}
