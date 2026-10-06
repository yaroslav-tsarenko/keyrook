"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { ProductRow, type CatalogProduct } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { NAV_CATEGORIES } from "@/config/navigation";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { subtreeCount, type CategoryNode } from "@/lib/hooks/useCategoryTree";
import { cn } from "@/lib/utils/cn";


function flatten(categories: CategoryNode[]): CategoryNode[] {
  return categories.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}

type Option =
  | { kind: "product"; id: string; href: string; product: CatalogProduct }
  | { kind: "category"; id: string; href: string; category: CategoryNode }
  | { kind: "all"; id: string; href: string; total: number };

export function SearchDialog({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: CategoryNode[] }) {
  const router = useRouter();
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; products: CatalogProduct[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmed = query.trim();

  useEffect(() => {
    if (!open) return;
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(trimmed)}&pageSize=6`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { data?: CatalogProduct[]; total?: number }) => {
          setResults({ q: trimmed, products: data.data ?? [], total: data.total ?? 0 });
          setActiveIndex(-1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, open]);

  const matchedCategories = useMemo(() => {
    if (trimmed.length < 2) return [];
    const q = trimmed.toLowerCase();
    return flatten(categories)
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [categories, trimmed]);

  const options: Option[] = useMemo(() => {
    if (!results) return [];
    const list: Option[] = results.products.slice(0, 6).map((p) => ({ kind: "product", id: `${baseId}-p-${p.id}`, href: `/product/${p.slug}`, product: p }));
    matchedCategories.forEach((c) => list.push({ kind: "category", id: `${baseId}-c-${c.id}`, href: `/catalog/${c.slug}`, category: c }));
    if (results.total > 0) list.push({ kind: "all", id: `${baseId}-all`, href: `/search?q=${encodeURIComponent(results.q)}`, total: results.total });
    return list;
  }, [results, matchedCategories, baseId]);

  const close = () => {
    setQuery("");
    setResults(null);
    onClose();
  };

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) go(options[activeIndex].href);
      else if (trimmed) go(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const listboxId = `${baseId}-listbox`;
  const products = options.filter((o): o is Extract<Option, { kind: "product" }> => o.kind === "product");
  const cats = options.filter((o): o is Extract<Option, { kind: "category" }> => o.kind === "category");
  const all = options.find((o): o is Extract<Option, { kind: "all" }> => o.kind === "all");
  const empty = results && results.products.length === 0 && matchedCategories.length === 0;
  const optionCls = (id: string) => cn("block w-full cursor-pointer rounded-control", options[activeIndex]?.id === id && "bg-brand-soft shadow-[inset_2px_0_0_var(--color-accent)]");

  return (
    <Sheet open={open} onClose={close} side="top" label="Search" initialFocus={inputRef}>
      <div className="mx-auto flex max-h-[80vh] max-w-container flex-col px-gutter pb-6 pt-5">
        <div className="flex items-center gap-3 border-b border-rule pb-3">
          <Search size={20} aria-hidden="true" className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? options[activeIndex]?.id : undefined}
            aria-label="Search games and gift cards"
            placeholder="Search a game, gift card or publisher"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-14 min-w-0 flex-1 bg-transparent text-step-2 text-ink placeholder:text-ink-subtle focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? <ReadoutLoader label="Searching" /> : null}
          <button type="button" onClick={close} className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            Close
            <kbd className="rounded-[1px] border border-line px-1.5 font-mono text-[0.6875rem] font-normal leading-[1.3] text-ink-muted max-sm:hidden">Esc</kbd>
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div id={listboxId} role="listbox" aria-label="Search suggestions" className={cn(options.length === 0 && "hidden")}>
            {products.length > 0 ? (
              <div role="group" aria-labelledby={`${baseId}-products`} className="pt-5">
                <p id={`${baseId}-products`} className="eyebrow m-0 pb-2">Products</p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  {products.map((o) => (
                    <div
                      key={o.id}
                      id={o.id}
                      role="option"
                      aria-selected={options[activeIndex]?.id === o.id}
                      onClick={() => go(o.href)}
                      onPointerEnter={() => setActiveIndex(options.indexOf(o))}
                      className={cn(optionCls(o.id), "border-b border-line px-2 py-2.5")}
                    >
                      <ProductRow name={o.product.name} imageUrl={o.product.images?.[0]?.url} keyInfo={o.product.key} headingLevel={3} aside={<PriceDisplay price={Number(o.product.price)} size="sm" />} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {cats.length > 0 ? (
              <div role="group" aria-labelledby={`${baseId}-cats`} className="pt-6">
                <p id={`${baseId}-cats`} className="eyebrow m-0 pb-2">Product types</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {cats.map((o) => (
                    <div
                      key={o.id}
                      id={o.id}
                      role="option"
                      aria-selected={options[activeIndex]?.id === o.id}
                      onClick={() => go(o.href)}
                      onPointerEnter={() => setActiveIndex(options.indexOf(o))}
                      className={cn(optionCls(o.id), "inline-flex w-auto min-h-11 items-center gap-2 px-2 font-display text-[1rem] font-semibold text-ink")}
                    >
                      {o.category.name}
                      <span className="font-mono text-[0.75rem] font-normal text-ink-subtle">· {subtreeCount(o.category)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {all ? (
              <div className="pt-5">
                <div
                  id={all.id}
                  role="option"
                  aria-selected={options[activeIndex]?.id === all.id}
                  onClick={() => go(all.href)}
                  onPointerEnter={() => setActiveIndex(options.indexOf(all))}
                  className={cn(optionCls(all.id), "inline-flex w-auto min-h-11 items-center px-2 text-ui-md font-semibold text-ink underline decoration-1 underline-offset-4")}
                >
                  See all {all.total.toLocaleString("en-GB")} results
                </div>
              </div>
            ) : null}
          </div>

          {empty ? (
            <div className="pt-6" role="status">
              <p className="m-0 text-step-1 text-ink">Nothing matches &ldquo;{results?.q}&rdquo;.</p>
              <p className="m-0 mt-2 text-ui-md text-ink-muted">Try a shorter title, or start from a product type:</p>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
                {NAV_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/catalog/${c.slug}`} onClick={close} className="text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
