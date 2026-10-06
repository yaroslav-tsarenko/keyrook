"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Checkbox, Switch } from "@/components/ui/Choice";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Dialog";
import { TickBand } from "@/components/ui/Dial";
import { FilterChip, FilterChipRow } from "@/components/ui/Chip";
import { platformInfo, typeTone } from "@/lib/catalog/platforms";
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

export function FilterGroup({ title, selectedCount = 0, defaultOpen = false, children }: { title: string; selectedCount?: number; defaultOpen?: boolean; children: ReactNode }) {
  const t = useTranslations("catalog");
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-open={open || undefined} data-filter-group="" className="border-b border-line">
      <h3 className="m-0 font-sans font-normal tracking-normal [font-stretch:100%]">
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-trigger`} onClick={() => setOpen((v) => !v)} className="flex h-12 w-full cursor-pointer items-center gap-3 text-left text-ink">
          <span className="eyebrow flex-1">{title}</span>
          {selectedCount > 0 ? (
            <span className="font-mono text-data-sm font-medium text-ink" aria-label={t("selectedCount", { count: selectedCount })}>
              {selectedCount}
            </span>
          ) : null}
          <ChevronDown size={16} aria-hidden="true" className={cn("text-ink-muted transition-transform duration-[180ms] ease-[var(--ease-latch)]", open && "rotate-180")} />
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} inert={!open} className={cn("grid transition-[grid-template-rows] duration-[180ms] ease-[var(--ease-latch)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="relative min-h-0 overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
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

const PRICE_DETENTS = [5, 10, 20, 40];

export interface RangeRulerProps {
  bounds: { min: number; max: number };
  value: { min: number; max: number };
  onCommit: (value: { min: number; max: number }) => void;
  format: (n: number) => string;
  labels: { min: string; max: string };
  detents?: number[];
  step?: number;
  scale?: "linear" | "sqrt";
  children?: ReactNode;
}

export function RangeRuler({ bounds, value, onCommit, format, labels, detents = [], step = 1, scale = "linear", children }: RangeRulerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const signature = `${value.min}|${value.max}`;
  const [state, setState] = useState({ signature, min: value.min, max: value.max });
  if (state.signature !== signature) setState({ signature, min: value.min, max: value.max });
  const local = { min: state.min, max: state.max };
  const setLocal = (fn: (cur: { min: number; max: number }) => { min: number; max: number }) => setState((s) => ({ ...s, ...fn({ min: s.min, max: s.max }) }));
  const dragging = useRef<"min" | "max" | null>(null);
  const span = Math.max(step, bounds.max - bounds.min);
  const toT = (n: number) => {
    const t = (n - bounds.min) / span;
    return scale === "sqrt" ? Math.sqrt(Math.max(0, t)) : t;
  };
  const fromT = (t: number) => bounds.min + (scale === "sqrt" ? t * t : t) * span;
  const pct = (n: number) => toT(n) * 100;
  const clampStep = (n: number) => Math.round(Math.min(bounds.max, Math.max(bounds.min, n)) / step) * step;

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return bounds.min;
    return clampStep(fromT(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))));
  };

  const update = (thumb: "min" | "max", next: number) => {
    setLocal((cur) => (thumb === "min" ? { min: Math.min(next, cur.max), max: cur.max } : { min: cur.min, max: Math.max(next, cur.min) }));
  };

  const commit = () => {
    if (local.min !== value.min || local.max !== value.max) onCommit(local);
  };

  const stops = [bounds.min, ...detents.filter((d) => d > bounds.min && d < bounds.max), bounds.max];
  const onKey = (thumb: "min" | "max") => (e: KeyboardEvent<HTMLSpanElement>) => {
    const current = local[thumb];
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
    else if (e.key === "PageUp") next = stops.find((s) => s > current) ?? bounds.max;
    else if (e.key === "PageDown") next = [...stops].reverse().find((s) => s < current) ?? bounds.min;
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
      aria-label={which === "min" ? labels.min : labels.max}
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
      data-thumb={which}
      style={{ left: `${pct(local[which])}%` }}
      className="absolute bottom-0 z-[2] flex h-8 w-6 -translate-x-1/2 cursor-grab touch-none items-end justify-center active:cursor-grabbing"
    >
      <span aria-hidden="true" className="block h-3.5 w-0.5 bg-brand" />
    </span>
  );

  return (
    <div className="px-3 pb-1 pt-2" data-range-ruler="">
      <div ref={trackRef} className="relative">
        {children}
        <div className="relative h-8">
          <TickBand className="absolute inset-x-0 bottom-px" major={false} />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule" />
          <span aria-hidden="true" className="absolute bottom-0 h-0.5 bg-ink" style={{ left: `${pct(local.min)}%`, right: `${100 - pct(local.max)}%` }} />
          {stops.map((d) => (
            <span key={d} aria-hidden="true" className="absolute bottom-0 h-3 w-px -translate-x-1/2 bg-ink-subtle" style={{ left: `${pct(d)}%` }} />
          ))}
          {thumb("min")}
          {thumb("max")}
        </div>
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[0.75rem] text-ink-muted" aria-hidden="true">
        {stops.map((d, i) => (
          <span key={d} className={cn("absolute top-0 whitespace-nowrap", i === 0 ? "" : i === stops.length - 1 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: `${pct(d)}%` }}>
            {format(d)}
          </span>
        ))}
      </div>
    </div>
  );
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
        <Input label={t("min")} size="sm" mono inputMode="decimal" prefix={symbol} placeholder={bounds ? String(lo) : undefined} value={draft.min} onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value.replace(/[^0-9.]/g, "") }))} onBlur={() => commit(draft.min, draft.max)} />
        <Input label={t("max")} size="sm" mono inputMode="decimal" prefix={symbol} placeholder={bounds ? String(hi) : undefined} value={draft.max} onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value.replace(/[^0-9.]/g, "") }))} onBlur={() => commit(draft.min, draft.max)} />
        <button type="submit" className="sr-only">
          {t("applyPrice")}
        </button>
      </form>
      {bounds && hi > lo ? (
        <div className="mt-3">
          <RangeRuler
            bounds={{ min: lo, max: hi }}
            value={{ min: minPrice !== null ? Math.max(lo, Math.floor(toDisplay(minPrice))) : lo, max: maxPrice !== null ? Math.min(hi, Math.ceil(toDisplay(maxPrice))) : hi }}
            format={(n) => format(n)}
            labels={{ min: t("minPrice"), max: t("maxPrice") }}
            detents={PRICE_DETENTS}
            scale="sqrt"
            onCommit={(v) => onChange({ minPrice: v.min > lo ? toBase(v.min) : null, maxPrice: v.max < hi ? toBase(v.max) : null })}
          />
        </div>
      ) : null}
    </>
  );
}

function YearHistogram({ options, selected, onChange }: { options: FacetOption[]; selected: string[]; onChange: (years: string[]) => void }) {
  const years = options.map((o) => Number(o.key)).filter(Number.isFinite);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const counts = new Map(options.map((o) => [Number(o.key), o.count]));
  const peak = Math.max(1, ...options.map((o) => o.count));
  const chosen = selected.map(Number).filter(Number.isFinite);
  const value = { min: chosen.length ? Math.min(...chosen) : min, max: chosen.length ? Math.max(...chosen) : max };
  const all = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const span = Math.max(1, max - min);
  if (!Number.isFinite(min) || max <= min) return null;
  return (
    <div data-year-histogram="">
      <RangeRuler
        bounds={{ min, max }}
        value={value}
        format={(n) => String(n)}
        labels={{ min: "From year", max: "To year" }}
        detents={all.filter((y) => y % 5 === 0)}
        onCommit={(v) => {
          if (v.min === min && v.max === max) onChange([]);
          else onChange(all.filter((y) => y >= v.min && y <= v.max && counts.has(y)).map(String));
        }}
      >
        <div aria-hidden="true" className="relative h-12">
          {all.map((y) => {
            const c = counts.get(y) ?? 0;
            const inRange = y >= value.min && y <= value.max;
            return <span key={y} className={cn("absolute bottom-0 w-1.5 -translate-x-1/2", inRange ? "bg-ink-muted" : "bg-line-hover")} style={{ left: `${((y - min) / span) * 100}%`, height: `${c ? Math.max(6, (c / peak) * 100) : 0}%` }} />;
          })}
        </div>
      </RangeRuler>
    </div>
  );
}

function OptionRows({ filter, options, selected, onToggle }: { filter: ListFilter; options: FacetOption[]; selected: string[]; onToggle: (key: string) => void }) {
  return (
    <div>
      {options.map((option) => {
        const tone = filter === "platforms" ? platformInfo(option.key).tone : null;
        const type = filter === "types" ? typeTone(option.key) : null;
        return (
          <div key={option.key} data-platform={tone ?? undefined} data-type={type ?? undefined} className={cn(type && "[&_label:hover_.opt-label]:underline [&_label:hover_.opt-label]:decoration-type [&_label:hover_.opt-label]:decoration-2 [&_label:hover_.opt-label]:underline-offset-4")}>
            <Checkbox
              dense
              label={
                <span className="opt-label inline-flex items-center gap-2">
                  {tone ? <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" /> : null}
                  {option.label}
                </span>
              }
              count={option.count}
              checked={selected.includes(option.key)}
              disabled={option.count === 0 && !selected.includes(option.key)}
              onChange={() => onToggle(option.key)}
            />
          </div>
        );
      })}
    </div>
  );
}

function SearchableRows({ filter, options, selected, onToggle, placeholder }: { filter: ListFilter; options: FacetOption[]; selected: string[]; onToggle: (key: string) => void; placeholder: string }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  return (
    <div>
      {options.length > 10 ? <Input label={placeholder} labelHidden size="sm" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-2" /> : null}
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <OptionRows filter={filter} options={visible} selected={selected} onToggle={onToggle} />
        {visible.length === 0 ? <p className="m-0 py-2 text-ui-sm text-ink-muted">Nothing matches “{query}”.</p> : null}
      </div>
    </div>
  );
}

function LanguageCombobox({ options, selected, onToggle }: { options: FacetOption[]; selected: string[]; onToggle: (key: string) => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options), [options, q]);
  const listId = `${id}-list`;
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && open && visible[active]) {
      e.preventDefault();
      onToggle(visible[active].key);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="mb-1.5 block text-ui-sm text-ink-muted">
        Interface or audio language
      </label>
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[active] ? `${id}-opt-${visible[active].key}` : undefined}
        value={query}
        placeholder="Find a language"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
        className="block h-10 w-full border border-control bg-raised px-3 text-ui-sm text-ink shadow-machined-pressed placeholder:text-ink-subtle hover-device:hover:border-ink-muted"
      />
      {open ? (
        <ul id={listId} role="listbox" aria-multiselectable="true" aria-label="Languages" className="absolute inset-x-0 top-full z-10 m-0 mt-1 max-h-[260px] list-none overflow-y-auto border border-control bg-raised p-0 shadow-lg">
          {visible.length === 0 ? <li className="px-3 py-2 text-ui-sm text-ink-muted">Nothing matches “{query}”.</li> : null}
          {visible.map((o, i) => {
            const isSelected = selected.includes(o.key);
            return (
              <li
                key={o.key}
                id={`${id}-opt-${o.key}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onToggle(o.key)}
                onPointerEnter={() => setActive(i)}
                className={cn("flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-ui-sm text-ink", i === active && "bg-brand-soft")}
              >
                <span className={cn("grid size-4 shrink-0 place-items-center border", isSelected ? "border-brand bg-brand text-on-brand" : "border-control")}>{isSelected ? <Check size={12} aria-hidden="true" /> : null}</span>
                <span className="flex-1">{o.label}</span>
                <span className="font-mono text-data-sm text-ink-muted">{o.count.toLocaleString("en-GB")}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {selected.length ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
          {selected.map((key) => (
            <li key={key}>
              <FilterChip label={options.find((o) => o.key === key)?.label ?? key} onRemove={() => onToggle(key)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export interface ProductFiltersProps {
  facets: CatalogFacets;
  selection: FilterSelection;
  onChange: (next: Partial<FilterSelection>) => void;
  hide?: ListFilter[];
  lockOnSale?: boolean;
  className?: string;
}

export function ProductFilters({ facets, selection, onChange, hide = [], lockOnSale = false, className }: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const priceCount = (selection.minPrice !== null ? 1 : 0) + (selection.maxPrice !== null ? 1 : 0);
  const list = (filter: ListFilter) => facets[filter].filter((o) => o.count > 0 || o.selected);
  const toggle = (filter: ListFilter) => (key: string) => onChange({ [filter]: toggleValue(selection[filter], key) } as Partial<FilterSelection>);
  const show = (filter: ListFilter) => !hide.includes(filter) && (list(filter).length > 1 || selection[filter].length > 0);

  return (
    <div className={cn("border-t border-rule", className)} data-vault-index="">
      {show("types") ? (
        <FilterGroup title="Type" selectedCount={selection.types.length} defaultOpen>
          <OptionRows filter="types" options={list("types")} selected={selection.types} onToggle={toggle("types")} />
        </FilterGroup>
      ) : null}
      {show("platforms") ? (
        <FilterGroup title="Platform" selectedCount={selection.platforms.length} defaultOpen>
          <OptionRows filter="platforms" options={list("platforms")} selected={selection.platforms} onToggle={toggle("platforms")} />
        </FilterGroup>
      ) : null}
      {show("regions") ? (
        <FilterGroup title="Region" selectedCount={selection.regions.length} defaultOpen={selection.regions.length > 0}>
          <OptionRows filter="regions" options={list("regions")} selected={selection.regions} onToggle={toggle("regions")} />
          <p className="m-0 mt-2 text-ui-sm text-ink-muted">A region-locked key activates only on accounts in that region.</p>
        </FilterGroup>
      ) : null}
      {show("genres") ? (
        <FilterGroup title="Genre" selectedCount={selection.genres.length} defaultOpen={selection.genres.length > 0}>
          <SearchableRows filter="genres" options={list("genres")} selected={selection.genres} onToggle={toggle("genres")} placeholder="Find a genre" />
        </FilterGroup>
      ) : null}
      {facets.price ? (
        <FilterGroup title={t("groupPrice")} selectedCount={priceCount} defaultOpen>
          <PriceGroup bounds={facets.price} minPrice={selection.minPrice} maxPrice={selection.maxPrice} onChange={onChange} />
        </FilterGroup>
      ) : null}
      {show("languages") ? (
        <FilterGroup title="Language" selectedCount={selection.languages.length} defaultOpen={selection.languages.length > 0}>
          <LanguageCombobox options={list("languages")} selected={selection.languages} onToggle={toggle("languages")} />
        </FilterGroup>
      ) : null}
      {show("years") ? (
        <FilterGroup title="Release year" selectedCount={selection.years.length ? 1 : 0} defaultOpen={selection.years.length > 0}>
          <YearHistogram options={list("years")} selected={selection.years} onChange={(years) => onChange({ years })} />
        </FilterGroup>
      ) : null}
      {!lockOnSale && (facets.onSaleCount > 0 || selection.onSale) ? (
        <FilterGroup title="On sale" selectedCount={selection.onSale ? 1 : 0} defaultOpen>
          <Switch checked={selection.onSale} onChange={(v) => onChange({ onSale: v })} label="Only show discounted keys" description={`${facets.onSaleCount.toLocaleString("en-GB")} ${facets.onSaleCount === 1 ? "key" : "keys"}`} className="py-1" />
        </FilterGroup>
      ) : null}
    </div>
  );
}

export interface SummaryChip {
  key: string;
  label: string;
  platform?: string | null;
  onRemove: () => void;
}

export function FilterSummary({ total, parts = [], chips = [], onClearAll, className }: { total: number; parts?: string[]; chips?: SummaryChip[]; onClearAll?: () => void; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <p className="m-0 font-mono text-data text-ink" aria-live="polite">
        {[`${total.toLocaleString("en-GB")} ${total === 1 ? "key" : "keys"}`, ...parts].join(" · ")}
      </p>
      {chips.length > 0 ? (
        <FilterChipRow onClearAll={onClearAll}>
          {chips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} platform={chip.platform} onRemove={chip.onRemove} />
          ))}
        </FilterChipRow>
      ) : null}
    </div>
  );
}

export function ProductFiltersSheet({ open, onClose, total, onClearAll, children }: { open: boolean; onClose: () => void; total: number; onClearAll: () => void; children: ReactNode }) {
  const t = useTranslations("catalog");
  const titleId = useId();
  return (
    <Sheet open={open} onClose={onClose} side="bottom" labelledBy={titleId}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
          <h2 id={titleId} className="text-step-2 font-semibold leading-none">
            {t("filtersTitle")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("closeFilters")} className="flex size-11 cursor-pointer items-center justify-center text-ink">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-raised px-4 py-3">
          <Button variant="ghost" onPress={onClearAll}>
            Clear all
          </Button>
          <Button onPress={onClose} className="flex-1">
            Show {total.toLocaleString("en-GB")} {total === 1 ? "key" : "keys"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
