"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductCover } from "@/components/product/ProductCover";
import { productFace, type CatalogProduct } from "@/components/product/product-face";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { BOARD_COLUMNS, PLATFORM_LINKS, navCategory } from "@/config/navigation";
import { findCategory, subtreeCount, type CategoryNode } from "@/lib/hooks/useCategoryTree";
import { cachedFetchJSON, readCached } from "@/lib/utils/reliable-fetch";

function findAny(categories: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const root of categories) {
    if (root.slug === slug) return root;
    const child = root.children?.find((c) => c.slug === slug);
    if (child) return child;
  }
  return undefined;
}

function usePreview(slug: string | null) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  useEffect(() => {
    if (!slug) return;
    const cacheKey = `board:preview:${slug}`;
    const cached = readCached<{ data: CatalogProduct[] }>({ cacheKey, storage: "session" });
    if (cached) setProduct(cached.data?.find((p) => p.images?.length) ?? null);
    let cancelled = false;
    cachedFetchJSON<{ data: CatalogProduct[] }>(`/api/products?category=${encodeURIComponent(slug)}&pageSize=4&inStock=true&sort=price-desc`, { cacheKey, storage: "session" })
      .then((res) => {
        if (!cancelled) setProduct(res.data?.find((p) => p.images?.length) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return product;
}

export interface CatalogBoardProps {
  id: string;
  open: boolean;
  categories: CategoryNode[];
  activeSlug?: string | null;
  onClose: (restoreFocus?: boolean) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

const headCls = "label-caps flex items-baseline justify-between gap-2 text-[0.9375rem] text-ink decoration-1 underline-offset-4 hover-device:hover:underline";
const platformCls =
  "relative flex min-h-7 items-baseline justify-between gap-3 py-0.5 pl-2.5 text-ui-md text-ink-muted transition-colors duration-[140ms] before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:bg-brand before:opacity-0 hover-device:hover:text-ink hover-device:hover:before:opacity-100 focus-visible:text-ink aria-[current=page]:text-ink aria-[current=page]:before:opacity-100";

export function CatalogBoard({ id, open, categories, activeSlug = null, onClose, onPointerEnter, onPointerLeave }: CatalogBoardProps) {
  const [pointed, setPointed] = useState<string | null>(null);
  const focus = pointed ?? "games";
  const preview = usePreview(open ? focus : null);
  const focusNode = findAny(categories, focus);
  const focusName = navCategory(focus)?.name ?? focusNode?.name ?? "";

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const target = e.target as HTMLElement;
    const column = target.closest<HTMLElement>("[data-board-col]");
    if (!column) return;
    const columns = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-board-col]"));
    const links = Array.from(column.querySelectorAll<HTMLAnchorElement>("a"));
    const index = links.indexOf(target as HTMLAnchorElement);
    e.preventDefault();
    if (e.key === "ArrowDown") links[Math.min(links.length - 1, index + 1)]?.focus();
    else if (e.key === "ArrowUp") links[Math.max(0, index - 1)]?.focus();
    else {
      const ci = columns.indexOf(column);
      const next = columns[e.key === "ArrowRight" ? Math.min(columns.length - 1, ci + 1) : Math.max(0, ci - 1)];
      next?.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };

  if (!open) return null;

  const face = preview ? productFace(preview.name, preview.key) : null;

  return (
    <div
      id={id}
      data-board=""
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && (e.currentTarget.contains(next) || (next as HTMLElement).closest?.("[data-board-trigger]"))) return;
        onClose(false);
      }}
      className="absolute inset-x-0 top-full z-50 max-h-[72vh] animate-panel-in overflow-y-auto border-t border-line bg-rig text-ink shadow-lg"
    >
      <div className="mx-auto grid max-w-container grid-cols-[minmax(0,1fr)_280px] gap-10 px-gutter py-8">
        <div className="grid grid-cols-7 gap-x-6">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.title} data-board-col="" className={cn("min-w-0", col.wide && "col-span-2")}>
              {col.slugs.map((slug, i) => {
                const node = findCategory(categories, slug);
                const name = navCategory(slug)?.name ?? node?.name ?? slug;
                const children = (node?.children ?? []).filter((c) => subtreeCount(c) > 0);
                return (
                  <div key={slug} className={cn(i > 0 && "mt-6")}>
                    <Link href={`/catalog/${slug}`} onFocus={() => setPointed(slug)} onPointerEnter={() => setPointed(slug)} onClick={() => onClose(false)} className={headCls}>
                      <span>{name}</span>
                      {node ? <span className="font-mono text-[0.75rem] font-normal normal-case tracking-normal text-ink-subtle">{subtreeCount(node)}</span> : null}
                    </Link>
                    {children.length > 0 ? (
                      <ul className={cn("m-0 mt-3 list-none p-0", col.wide && "columns-2 gap-x-6")}>
                        {children.map((child) => (
                          <li key={child.id} className="break-inside-avoid">
                            <Link
                              href={`/catalog/${child.slug}`}
                              aria-current={activeSlug === child.slug ? "page" : undefined}
                              onFocus={() => setPointed(child.slug)}
                              onPointerEnter={() => setPointed(child.slug)}
                              onClick={() => onClose(false)}
                              className={platformCls}
                            >
                              <span className="min-w-0 truncate">{child.name}</span>
                              <span className="font-mono text-[0.75rem] text-ink-subtle">{subtreeCount(child)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div data-board-col="" className="min-w-0 border-l border-line pl-8">
          {preview && face ? (
            <div className="relative">
              <div className="relative mx-auto w-2/3 overflow-hidden rounded-tray">
                <ProductCover src={preview.images?.[0]?.url} alt="" sizes="180px" />
              </div>
              <p className="eyebrow m-0 mt-3">{[face.typeLabel, face.platform].filter(Boolean).join(" · ")}</p>
              <p className="m-0 mt-1 line-clamp-2 font-display text-step-1 font-semibold leading-[1.12] text-ink">{face.title}</p>
              <p className="m-0 mt-2 flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.75rem] text-ink-muted">{face.region ?? "—"}</span>
                <PriceDisplay price={Number(preview.price)} size="sm" />
              </p>
              <Link href={`/product/${preview.slug}`} onClick={() => onClose(false)} className="absolute inset-0" aria-label={preview.name} />
            </div>
          ) : null}
          <Link
            href={`/catalog/${focus}`}
            onClick={() => onClose(false)}
            className="mt-5 inline-flex items-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
          >
            All {focusName.toLowerCase()}
            {focusNode ? <span className="font-mono text-[0.75rem] font-normal text-ink-muted">· {subtreeCount(focusNode)}</span> : null}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/catalog" onClick={() => onClose(false)} className="mt-2 flex text-ui-sm text-ink-muted decoration-1 underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline">
            Browse the whole catalogue
          </Link>
          <p className="eyebrow m-0 mt-6">By platform</p>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => onClose(false)} className="text-ui-sm text-ink-muted decoration-1 underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
