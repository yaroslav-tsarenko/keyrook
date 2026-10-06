"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Checkbox, Segmented } from "@/components/ui/Choice";
import { Jaw } from "@/components/skin/FloatRuler";
import { WEAPON_TYPES, raritySlug, weaponSlug } from "@/lib/skins/cs2";
import { ExteriorFilter } from "./ExteriorFilter";
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
  weapons: string[];
  rarities: string[];
  exteriors: string[];
  qualities: string[];
  phases: string[];
  collections: string[];
  floatMin: number | null;
  floatMax: number | null;
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
      <Jaw />
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

function OptionRows({
  options,
  selected,
  onToggle,
  rarity = false,
}: {
  options: FacetOption[];
  selected: string[];
  onToggle: (key: string) => void;
  rarity?: boolean;
}) {
  return (
    <div>
      {options.map((option) => {
        const slug = rarity ? raritySlug(option.key) : undefined;
        return (
          <div key={option.key} data-rarity={slug} className={cn(rarity && "spine-row pl-2.5")}>
            <Checkbox
              dense
              label={rarity ? <span className="font-mono text-[0.75rem] font-medium uppercase tracking-[0.06em] text-rarity [font-stretch:87.5%]">{option.label}</span> : option.label}
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

function WeaponRows({ options, selected, onToggle }: { options: FacetOption[]; selected: string[]; onToggle: (key: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const groups = WEAPON_TYPES.map((type) => ({
    type,
    options: visible.filter((o) => type.weapons.some((w) => weaponSlug(w) === o.key)),
  })).filter((g) => g.options.length > 0);
  const showGroups = groups.length > 1;
  return (
    <div>
      {options.length > 10 ? (
        <Input label="Find a weapon" labelHidden size="sm" mono placeholder="Find a weapon" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-2" />
      ) : null}
      <div className="max-h-[360px] overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g.type.key} className={cn(showGroups && "mb-2")}>
            {showGroups ? <p className="eyebrow m-0 pb-1 pt-2 text-ink-subtle">{g.type.label}</p> : null}
            <OptionRows options={g.options} selected={selected} onToggle={onToggle} />
          </div>
        ))}
        {groups.length === 0 ? <p className="m-0 py-2 text-ui-sm text-ink-muted">No weapon matches “{query}”.</p> : null}
      </div>
    </div>
  );
}

type Tri = "any" | "only" | "none";
const QUALITY_ALL = ["normal", "stattrak", "souvenir"];

function markState(qualities: string[], mark: "stattrak" | "souvenir"): Tri {
  if (qualities.length === 0) return "any";
  if (qualities.length === 1 && qualities[0] === mark) return "only";
  if (!qualities.includes(mark)) return "none";
  return "any";
}

function qualitiesFor(st: Tri, sv: Tri): string[] {
  let set = new Set(QUALITY_ALL);
  if (st === "only") set = new Set(["stattrak"]);
  if (st === "none") set.delete("stattrak");
  if (sv === "only") set = new Set([...set].filter((k) => k === "souvenir"));
  if (sv === "none") set.delete("souvenir");
  if (st === "only" && sv === "only") set = new Set();
  return set.size === QUALITY_ALL.length ? [] : [...set].sort();
}

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "only", label: "Only" },
  { value: "none", label: "None" },
];

export interface ProductFiltersProps {
  facets: CatalogFacets;
  selection: FilterSelection;
  onChange: (next: Partial<FilterSelection>) => void;
  className?: string;
}

export function ProductFilters({ facets, selection, onChange, className }: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const priceCount = (selection.minPrice !== null ? 1 : 0) + (selection.maxPrice !== null ? 1 : 0);
  const list = (filter: ListFilter) => facets[filter].filter((o) => o.count > 0 || o.selected);
  const types = list("types");
  const weapons = list("weapons");
  const rarities = list("rarities");
  const exteriors = list("exteriors");
  const phases = list("phases");
  const collections = list("collections");
  const qualityKeys = new Set(list("qualities").map((o) => o.key));
  const st = markState(selection.qualities, "stattrak");
  const sv = markState(selection.qualities, "souvenir");
  const toggle = (filter: ListFilter) => (key: string) => onChange({ [filter]: toggleValue(selection[filter], key) } as Partial<FilterSelection>);

  return (
    <div className={cn("border-t border-line", className)}>
      {types.length > 1 || selection.types.length > 0 ? (
        <FilterGroup title="Weapon type" selectedCount={selection.types.length} defaultOpen>
          <OptionRows options={types} selected={selection.types} onToggle={toggle("types")} />
        </FilterGroup>
      ) : null}

      {weapons.length > 1 || selection.weapons.length > 0 ? (
        <FilterGroup title="Weapon" selectedCount={selection.weapons.length} defaultOpen={selection.weapons.length > 0}>
          <WeaponRows options={weapons} selected={selection.weapons} onToggle={toggle("weapons")} />
        </FilterGroup>
      ) : null}

      {exteriors.length > 0 ? (
        <FilterGroup title="Exterior" selectedCount={selection.exteriors.length} defaultOpen>
          <ExteriorFilter options={facets.exteriors} selected={selection.exteriors} onChange={(next) => onChange({ exteriors: next })} />
        </FilterGroup>
      ) : null}

      {rarities.length > 0 ? (
        <FilterGroup title="Rarity" selectedCount={selection.rarities.length} defaultOpen>
          <OptionRows options={[...rarities].reverse()} selected={selection.rarities} onToggle={toggle("rarities")} rarity />
        </FilterGroup>
      ) : null}

      {facets.price ? (
        <FilterGroup title={t("groupPrice")} selectedCount={priceCount} defaultOpen>
          <PriceGroup bounds={facets.price} minPrice={selection.minPrice} maxPrice={selection.maxPrice} onChange={onChange} />
        </FilterGroup>
      ) : null}

      {qualityKeys.has("stattrak") || st !== "any" ? (
        <FilterGroup title="StatTrak™" selectedCount={st === "any" ? 0 : 1} defaultOpen={st !== "any"}>
          <Segmented label="StatTrak™" fullWidth value={st} options={TRI_OPTIONS} onChange={(v) => onChange({ qualities: qualitiesFor(v, sv) })} />
        </FilterGroup>
      ) : null}

      {qualityKeys.has("souvenir") || sv !== "any" ? (
        <FilterGroup title="Souvenir" selectedCount={sv === "any" ? 0 : 1} defaultOpen={sv !== "any"}>
          <Segmented label="Souvenir" fullWidth value={sv} options={TRI_OPTIONS} onChange={(v) => onChange({ qualities: qualitiesFor(st, v) })} />
        </FilterGroup>
      ) : null}

      {phases.length > 0 ? (
        <FilterGroup title="Phase" selectedCount={selection.phases.length} defaultOpen={selection.phases.length > 0}>
          <OptionRows options={phases} selected={selection.phases} onToggle={toggle("phases")} />
        </FilterGroup>
      ) : null}

      {collections.length > 0 ? (
        <FilterGroup title="Collection" selectedCount={selection.collections.length} defaultOpen={selection.collections.length > 0}>
          <WeaponlessSearch options={collections} selected={selection.collections} onToggle={toggle("collections")} />
        </FilterGroup>
      ) : null}
    </div>
  );
}

function WeaponlessSearch({ options, selected, onToggle }: { options: FacetOption[]; selected: string[]; onToggle: (key: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  return (
    <div>
      {options.length > 10 ? (
        <Input label="Find a collection" labelHidden size="sm" mono placeholder="Find a collection" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-2" />
      ) : null}
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <OptionRows options={visible} selected={selected} onToggle={onToggle} />
      </div>
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
  chips?: { key: string; label: string; onRemove: () => void; rarity?: string }[];
  onClearAll?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <p className="m-0 font-mono text-data text-ink" aria-live="polite">
        {[`${total.toLocaleString("en-GB")} ${total === 1 ? "skin" : "skins"}`, ...parts].join(" · ")}
      </p>
      {chips.length > 0 ? (
        <FilterChipRow onClearAll={onClearAll}>
          {chips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} rarity={chip.rarity} onRemove={chip.onRemove} />
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
            Show {total.toLocaleString("en-GB")} {total === 1 ? "skin" : "skins"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
