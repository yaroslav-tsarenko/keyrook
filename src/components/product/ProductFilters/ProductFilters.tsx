"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Checkbox } from "@/components/ui/Choice";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Dialog";
import { FilterChip, FilterChipRow } from "@/components/ui/Chip";
import { toggleValue, type CatalogFacets, type FacetOption, type ListFilter } from "@/components/catalog/catalog-url";

export interface FilterSelection {
  brand: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  onSale: boolean;
  types: string[];
  platforms: string[];
  regions: string[];
  genres: string[];
  languages: string[];
  years: string[];
}

export function FilterGroup({
  title,
  selectedCount = 0,
  defaultOpen = false,
  children,
}: {
  title: string;
  selectedCount?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("catalog");
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-open={open || undefined} className="border-b border-line">
      <h3 className="m-0 font-sans font-normal tracking-normal">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-trigger`}
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 w-full cursor-pointer items-center gap-3 text-left text-ink"
        >
          <span className="eyebrow flex-1">{title}</span>
          {selectedCount > 0 ? (
            <span className="font-mono text-data-sm font-semibold text-ink" aria-label={t("selectedCount", { count: selectedCount })}>
              {selectedCount}
            </span>
          ) : null}
          <ChevronDown size={16} aria-hidden="true" className={cn("text-ink-muted transition-transform duration-[200ms] ease-[var(--ease-instrument)]", open && "rotate-180")} />
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        inert={!open}
        className={cn("grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-instrument)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="relative min-h-0 overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export interface PriceRangeProps {
  bounds: { min: number; max: number };
  value: { min: number; max: number };
  onCommit: (value: { min: number; max: number }) => void;
  format: (n: number) => string;
  step?: number;
}

export function PriceRange({ bounds, value, onCommit, format, step = 1 }: PriceRangeProps) {
  const t = useTranslations("catalog");
  const trackRef = useRef<HTMLDivElement>(null);
  const signature = `${value.min}|${value.max}`;
  const [state, setState] = useState({ signature, min: value.min, max: value.max });
  if (state.signature !== signature) setState({ signature, min: value.min, max: value.max });
  const local = { min: state.min, max: state.max };
  const setLocal = (fn: (cur: { min: number; max: number }) => { min: number; max: number }) => setState((s) => ({ ...s, ...fn({ min: s.min, max: s.max }) }));
  const dragging = useRef<"min" | "max" | null>(null);
  const span = Math.max(step, bounds.max - bounds.min);

  const pct = (n: number) => ((n - bounds.min) / span) * 100;
  const clampStep = (n: number) => Math.round(Math.min(bounds.max, Math.max(bounds.min, n)) / step) * step;

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return bounds.min;
    return clampStep(bounds.min + ((clientX - rect.left) / rect.width) * span);
  };

  const update = (thumb: "min" | "max", next: number) => {
    setLocal((cur) => (thumb === "min" ? { min: Math.min(next, cur.max), max: cur.max } : { min: cur.min, max: Math.max(next, cur.min) }));
  };

  const commit = () => {
    if (local.min !== value.min || local.max !== value.max) onCommit(local);
  };

  const onKey = (thumb: "min" | "max") => (e: KeyboardEvent<HTMLSpanElement>) => {
    const current = local[thumb];
    const big = Math.max(step, Math.round(span / 10));
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
    else if (e.key === "PageUp") next = current + big;
    else if (e.key === "PageDown") next = current - big;
    else if (e.key === "Home") next = bounds.min;
    else if (e.key === "End") next = bounds.max;
    if (next === null) return;
    e.preventDefault();
    update(thumb, clampStep(next));
  };

  const thumb = (which: "min" | "max") => (
    <span
      role="slider"
      tabIndex={0}
      aria-label={which === "min" ? t("minPrice") : t("maxPrice")}
      aria-valuemin={which === "min" ? bounds.min : local.min}
      aria-valuemax={which === "min" ? local.max : bounds.max}
      aria-valuenow={local[which]}
      aria-valuetext={format(local[which])}
      onKeyDown={onKey(which)}
      onKeyUp={commit}
      onBlur={commit}
      onPointerDown={(e: PointerEvent<HTMLSpanElement>) => {
        dragging.current = which;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e: PointerEvent<HTMLSpanElement>) => {
        if (dragging.current === which) update(which, fromPointer(e.clientX));
      }}
      onPointerUp={() => {
        dragging.current = null;
        commit();
      }}
      style={{ left: `${pct(local[which])}%` }}
      className="absolute bottom-0 z-[1] flex h-8 w-6 -translate-x-1/2 cursor-grab touch-none items-end justify-center active:cursor-grabbing"
    >
      <span aria-hidden="true" className="block h-5 w-3 rounded-[2px] border border-ink bg-raised" />
    </span>
  );

  return (
    <div className="px-1.5 pb-1 pt-3">
      <div ref={trackRef} className="relative h-8">
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule" />
        <span aria-hidden="true" className="absolute bottom-0 h-1.5 bg-ink/85 [[data-theme=light]_&]:bg-ink" style={{ left: `${pct(local.min)}%`, right: `${100 - pct(local.max)}%` }} />
        {thumb("min")}
        {thumb("max")}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.75rem] text-ink-muted" aria-hidden="true">
        <span>{format(local.min)}</span>
        <span>{format(local.max)}</span>
      </div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function useDisplayPrice() {
  const { currency, rates } = useCurrency();
  const rate = rates[currency] || 1;
  const symbol = new Intl.NumberFormat("en-GB", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? "";
  const format = (n: number, digits = 0) => new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  return {
    currency,
    rate,
    symbol,
    format,
    toDisplay: (base: number) => round2(base * rate),
    toBase: (display: number) => round2(display / rate),
  };
}

function PriceGroup({
  bounds,
  minPrice,
  maxPrice,
  onChange,
}: {
  bounds: { min: number; max: number } | null;
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (next: { minPrice: number | null; maxPrice: number | null }) => void;
}) {
  const t = useTranslations("catalog");
  const { rate, symbol, format, toDisplay, toBase } = useDisplayPrice();
  const signature = `${minPrice}|${maxPrice}|${rate}`;
  const fromBase = (v: number | null) => (v === null ? "" : String(toDisplay(v)));
  const [draft, setDraft] = useState({ signature, min: fromBase(minPrice), max: fromBase(maxPrice) });
  if (draft.signature !== signature) setDraft({ signature, min: fromBase(minPrice), max: fromBase(maxPrice) });

  const parse = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? null : toBase(Number(s)));
  const commit = (min: string, max: string) => {
    const nextMin = parse(min);
    const nextMax = parse(max);
    if (nextMin === minPrice && nextMax === maxPrice) return;
    onChange({ minPrice: nextMin, maxPrice: nextMax });
  };

  const lo = bounds ? Math.floor(bounds.min * rate) : 0;
  const hi = bounds ? Math.ceil(bounds.max * rate) : 0;

  return (
    <>
      <form
        className="grid grid-cols-2 gap-3 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          commit(draft.min, draft.max);
        }}
      >
        <Input
          label={t("min")}
          size="sm"
          mono
          inputMode="decimal"
          prefix={symbol}
          placeholder={bounds ? String(lo) : undefined}
          value={draft.min}
          onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value.replace(/[^0-9.]/g, "") }))}
          onBlur={() => commit(draft.min, draft.max)}
        />
        <Input
          label={t("max")}
          size="sm"
          mono
          inputMode="decimal"
          prefix={symbol}
          placeholder={bounds ? String(hi) : undefined}
          value={draft.max}
          onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value.replace(/[^0-9.]/g, "") }))}
          onBlur={() => commit(draft.min, draft.max)}
        />
        <button type="submit" className="sr-only">
          {t("applyPrice")}
        </button>
      </form>
      {bounds && hi > lo ? (
        <PriceRange
          bounds={{ min: lo, max: hi }}
          value={{
            min: minPrice !== null ? Math.max(lo, Math.floor(toDisplay(minPrice))) : lo,
            max: maxPrice !== null ? Math.min(hi, Math.ceil(toDisplay(maxPrice))) : hi,
          }}
          format={(n) => format(n)}
          onCommit={(v) =>
            onChange({
              minPrice: v.min > lo ? toBase(v.min) : null,
              maxPrice: v.max < hi ? toBase(v.max) : null,
            })
          }
        />
      ) : null}
    </>
  );
}

function OptionRows({ options, selected, onToggle }: { options: FacetOption[]; selected: string[]; onToggle: (key: string) => void }) {
  return (
    <div>
      {options.map((option) => (
        <Checkbox
          key={option.key}
          dense
          label={option.label}
          count={option.count}
          checked={selected.includes(option.key)}
          disabled={option.count === 0 && !selected.includes(option.key)}
          onChange={() => onToggle(option.key)}
        />
      ))}
    </div>
  );
}

function SearchableRows({ options, selected, onToggle, placeholder }: { options: FacetOption[]; selected: string[]; onToggle: (key: string) => void; placeholder: string }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  return (
    <div>
      {options.length > 10 ? <Input label={placeholder} labelHidden size="sm" mono placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-2" /> : null}
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <OptionRows options={visible} selected={selected} onToggle={onToggle} />
        {visible.length === 0 ? <p className="m-0 py-2 text-ui-sm text-ink-muted">Nothing matches “{query}”.</p> : null}
      </div>
    </div>
  );
}

export interface ProductFiltersProps {
  facets: CatalogFacets;
  selection: FilterSelection;
  onChange: (next: Partial<FilterSelection>) => void;
  className?: string;
}

const GROUPS: { filter: ListFilter; title: string; open: boolean; search?: string }[] = [
  { filter: "types", title: "Product type", open: true },
  { filter: "platforms", title: "Platform", open: true },
  { filter: "regions", title: "Activation region", open: true },
  { filter: "genres", title: "Genre", open: false },
  { filter: "languages", title: "Language", open: false, search: "Find a language" },
  { filter: "years", title: "Release year", open: false, search: "Find a year" },
];

export function ProductFilters({ facets, selection, onChange, className }: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const priceCount = (selection.minPrice !== null ? 1 : 0) + (selection.maxPrice !== null ? 1 : 0);
  const list = (filter: ListFilter) => facets[filter].filter((o) => o.count > 0 || o.selected);
  const toggle = (filter: ListFilter) => (key: string) => onChange({ [filter]: toggleValue(selection[filter], key) } as Partial<FilterSelection>);

  const groups = GROUPS.map((group) => ({ ...group, options: list(group.filter) })).filter((g) => g.options.length > 1 || selection[g.filter].length > 0);
  const [head, tail] = [groups.slice(0, 3), groups.slice(3)];

  const listGroup = (g: (typeof groups)[number]) => (
    <FilterGroup key={g.filter} title={g.title} selectedCount={selection[g.filter].length} defaultOpen={g.open || selection[g.filter].length > 0}>
      {g.search ? <SearchableRows options={g.options} selected={selection[g.filter]} onToggle={toggle(g.filter)} placeholder={g.search} /> : <OptionRows options={g.options} selected={selection[g.filter]} onToggle={toggle(g.filter)} />}
    </FilterGroup>
  );

  return (
    <div className={cn("border-t border-line", className)}>
      {head.map(listGroup)}

      {facets.price ? (
        <FilterGroup title={t("groupPrice")} selectedCount={priceCount} defaultOpen>
          <PriceGroup bounds={facets.price} minPrice={selection.minPrice} maxPrice={selection.maxPrice} onChange={onChange} />
        </FilterGroup>
      ) : null}

      {facets.onSaleCount > 0 || selection.onSale ? (
        <FilterGroup title="Offers" selectedCount={selection.onSale ? 1 : 0} defaultOpen={selection.onSale}>
          <Checkbox dense label="Price drop" count={facets.onSaleCount} checked={selection.onSale} onChange={() => onChange({ onSale: !selection.onSale })} />
          <p className="m-0 mt-1 text-ui-xs text-ink-muted">At least 10% below its lowest price in the previous 30 days.</p>
        </FilterGroup>
      ) : null}

      {tail.map(listGroup)}
    </div>
  );
}

export function FilterSummary({
  total,
  parts = [],
  chips = [],
  onClearAll,
  className,
}: {
  total: number;
  parts?: string[];
  chips?: { key: string; label: string; onRemove: () => void }[];
  onClearAll?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <p className="m-0 font-mono text-data text-ink" aria-live="polite">
        {[`${total.toLocaleString("en-GB")} ${total === 1 ? "product" : "products"}`, ...parts].join(" · ")}
      </p>
      {chips.length > 0 ? (
        <FilterChipRow onClearAll={onClearAll}>
          {chips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </FilterChipRow>
      ) : null}
    </div>
  );
}

export function ProductFiltersSheet({
  open,
  onClose,
  total,
  onClearAll,
  children,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  onClearAll: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("catalog");
  const titleId = useId();
  return (
    <Sheet open={open} onClose={onClose} side="bottom" labelledBy={titleId}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
          <h2 id={titleId} className="text-step-2 font-semibold leading-none">
            {t("filtersTitle")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("closeFilters")} className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-raised px-4 py-3">
          <Button variant="ghost" onPress={onClearAll}>
            Clear all
          </Button>
          <Button onPress={onClose} className="flex-1">
            Show {total.toLocaleString("en-GB")} {total === 1 ? "product" : "products"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
