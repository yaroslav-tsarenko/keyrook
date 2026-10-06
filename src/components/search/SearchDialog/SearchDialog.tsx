"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { ProductRow, type CatalogProduct } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { DialLoader } from "@/components/ui/Dial";
import { searchCountLabel } from "@/lib/hooks/useStoreIndex";
import type { StoreIndex } from "@/lib/catalog/store-index";
import { cn } from "@/lib/utils/cn";

const RECENT_KEY = "keyrook-recent-searches";

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function rememberSearch(q: string) {
  try {
    const next = [q, ...readRecent().filter((v) => v.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

type Option =
  | { kind: "product"; id: string; href: string; product: CatalogProduct }
  | { kind: "link"; id: string; href: string; label: string; count: number; tone?: string; group: "platforms" | "genres" }
  | { kind: "all"; id: string; href: string; total: number };

export function SearchDialog({ open, onClose, index }: { open: boolean; onClose: () => void; index: StoreIndex | null }) {
  const router = useRouter();
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; products: CatalogProduct[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

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
      fetch(`/api/products?search=${encodeURIComponent(trimmed)}&pageSize=6&inStock=true`, { signal: controller.signal })
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

  const options: Option[] = useMemo(() => {
    if (!results) return [];
    const q = trimmed.toLowerCase();
    const list: Option[] = results.products.slice(0, 6).map((p) => ({ kind: "product", id: `${baseId}-p-${p.id}`, href: `/product/${p.slug}`, product: p }));
    (index?.platforms ?? [])
      .filter((p) => p.short.toLowerCase().includes(q) || p.key.includes(q))
      .forEach((p) => list.push({ kind: "link", id: `${baseId}-pl-${p.key}`, href: `/platform/${p.slug}`, label: p.short, count: p.count, tone: p.tone, group: "platforms" }));
    (index?.genres ?? [])
      .filter((g) => g.label.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((g) => list.push({ kind: "link", id: `${baseId}-g-${g.key}`, href: `/genre/${g.key}`, label: g.label, count: g.count, group: "genres" }));
    if (results.total > 0) list.push({ kind: "all", id: `${baseId}-all`, href: `/search?q=${encodeURIComponent(results.q)}`, total: results.total });
    return list;
  }, [results, index, trimmed, baseId]);

  const close = () => {
    setQuery("");
    setResults(null);
    onClose();
  };

  const go = (href: string) => {
    if (trimmed) rememberSearch(trimmed);
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
  const platformLinks = options.filter((o): o is Extract<Option, { kind: "link" }> => o.kind === "link" && o.group === "platforms");
  const genreLinks = options.filter((o): o is Extract<Option, { kind: "link" }> => o.kind === "link" && o.group === "genres");
  const all = options.find((o): o is Extract<Option, { kind: "all" }> => o.kind === "all");
  const empty = results && results.products.length === 0 && platformLinks.length === 0 && genreLinks.length === 0;
  const isActive = (id: string) => options[activeIndex]?.id === id;
  const optionCls = (id: string) => cn("block w-full cursor-pointer", isActive(id) && "bg-brand-soft");

  const linkGroup = (title: string, list: Extract<Option, { kind: "link" }>[]) =>
    list.length ? (
      <div role="group" aria-label={title} className="min-w-0">
        <p className="eyebrow m-0 pb-2">{title}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {list.map((o) => (
            <div key={o.id} id={o.id} role="option" aria-selected={isActive(o.id)} data-platform={o.tone} onClick={() => go(o.href)} onPointerEnter={() => setActiveIndex(options.indexOf(o))} className={cn(optionCls(o.id), "inline-flex w-auto min-h-10 items-center gap-2 px-1.5 text-ui-md text-ink")}>
              {o.tone ? <span aria-hidden="true" className="size-1.5 bg-platform" /> : null}
              {o.label}
              <span className="font-mono text-[0.75rem] text-ink-muted">· {o.count.toLocaleString("en-GB")}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <Sheet open={open} onClose={close} side="top" label="Search" initialFocus={inputRef} className="max-lg:!max-h-none max-lg:!h-dvh">
      <div className="mx-auto flex max-h-[80vh] max-w-container flex-col px-gutter pb-6 pt-4 max-lg:h-full max-lg:max-h-none" data-search-panel="">
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
            aria-label="Search keys"
            placeholder={`${searchCountLabel(index?.total)}: title, platform or genre`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-14 min-w-0 flex-1 bg-transparent text-step-2 text-ink placeholder:text-ink-subtle focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? <DialLoader size={16} label="Searching" /> : null}
          <button type="button" onClick={close} className="btn-text inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-ui-md font-[560] text-ink">
            <span data-label="">Close</span>
            <kbd className="tumbler-slot text-[0.6875rem] font-normal text-ink-muted max-sm:hidden">Esc</kbd>
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div id={listboxId} role="listbox" aria-label="Search suggestions" className={cn(options.length === 0 && "hidden")}>
            {products.length > 0 ? (
              <div role="group" aria-labelledby={`${baseId}-products`} className="pt-5">
                <p id={`${baseId}-products`} className="eyebrow m-0 pb-2">
                  Keys
                </p>
                <div className="grid gap-x-8 border-t border-line sm:grid-cols-2">
                  {products.map((o) => (
                    <div key={o.id} id={o.id} role="option" aria-selected={isActive(o.id)} onClick={() => go(o.href)} onPointerEnter={() => setActiveIndex(options.indexOf(o))} className={cn(optionCls(o.id), "border-b border-line px-2 py-2.5")}>
                      <ProductRow name={o.product.name} imageUrl={o.product.images?.[0]?.url} keyInfo={o.product.key} headingLevel={3} aside={<PriceDisplay price={Number(o.product.price)} size="sm" />} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {platformLinks.length || genreLinks.length ? (
              <div className="grid gap-6 pt-6 sm:grid-cols-2">
                {linkGroup("Platforms", platformLinks)}
                {linkGroup("Genres", genreLinks)}
              </div>
            ) : null}
            {all ? (
              <div className="pt-5">
                <div id={all.id} role="option" aria-selected={isActive(all.id)} onClick={() => go(all.href)} onPointerEnter={() => setActiveIndex(options.indexOf(all))} className={cn(optionCls(all.id), "inline-flex w-auto min-h-11 items-center gap-1.5 px-1.5 text-ui-md font-[560] text-ink underline decoration-1 underline-offset-4")}>
                  See all <span className="font-mono">{all.total.toLocaleString("en-GB")}</span> results
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
              </div>
            ) : null}
          </div>

          {empty ? (
            <div className="pt-6" role="status">
              <p className="m-0 text-step-1 text-ink">Nothing matches &ldquo;{results?.q}&rdquo;.</p>
              <p className="m-0 mt-2 text-ui-md text-ink-muted">Try the title without the edition name, or start from a platform:</p>
            </div>
          ) : null}

          {!results || empty ? (
            <div className="pt-6">
              {!results && recent.length ? (
                <div className="mb-6">
                  <p className="eyebrow m-0 pb-2">Recent searches</p>
                  <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                    {recent.map((r) => (
                      <li key={r}>
                        <button type="button" onClick={() => setQuery(r)} className="min-h-10 cursor-pointer text-ui-md text-ink underline-offset-4 hover-device:hover:underline">
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {index?.platforms.length ? (
                <>
                  <p className="eyebrow m-0 pb-2">Platforms</p>
                  <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4 lg:grid-cols-5">
                    {index.platforms.map((p) => (
                      <li key={p.key} data-platform={p.tone}>
                        <Link href={`/platform/${p.slug}`} onClick={close} className="plate flex h-14 items-center justify-between gap-2 px-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
                            <span className="eyebrow truncate text-ink">{p.short}</span>
                          </span>
                          <span className="font-mono text-[0.75rem] text-ink-muted">{p.count.toLocaleString("en-GB")}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
