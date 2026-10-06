"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { EXTERIORS, formatFloat } from "@/lib/skins/cs2";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/Choice";
import { Jaw, RulerTicks } from "@/components/skin/FloatRuler";
import { NOT_PAINTED, type FacetOption } from "@/components/catalog/catalog-url";

const STOPS = [0, ...EXTERIORS.map((e) => e.floatMax)];
const KEYS = EXTERIORS.map((e) => e.code.toLowerCase());

function contiguousRange(selected: string[]): [number, number] | null {
  const idx = KEYS.map((k, i) => (selected.includes(k) ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return [0, STOPS.length - 1];
  for (let i = 1; i < idx.length; i++) if (idx[i] !== idx[i - 1] + 1) return null;
  return [idx[0], idx[idx.length - 1] + 1];
}

function stopText(stop: number): string {
  const value = formatFloat(STOPS[stop]);
  if (stop === 0) return `${value}, start of ${EXTERIORS[0].label}`;
  if (stop === STOPS.length - 1) return `${value}, end of ${EXTERIORS[EXTERIORS.length - 1].label}`;
  return `${value}, start of ${EXTERIORS[stop].label}`;
}

export interface ExteriorFilterProps {
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function ExteriorFilter({ options, selected, onChange }: ExteriorFilterProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const range = contiguousRange(selected.filter((k) => k !== NOT_PAINTED));
  const [drag, setDrag] = useState<{ which: 0 | 1; stop: number } | null>(null);
  const counts = new Map(options.map((o) => [o.key, o.count]));
  const zoneKeys = selected.filter((k) => k !== NOT_PAINTED);
  const notPainted = options.find((o) => o.key === NOT_PAINTED);

  const live: [number, number] | null = range && drag ? (drag.which === 0 ? [Math.min(drag.stop, range[1] - 1), range[1]] : [range[0], Math.max(drag.stop, range[0] + 1)]) : range;

  const commitRange = (lo: number, hi: number) => {
    const keep = selected.filter((k) => k === NOT_PAINTED);
    if (lo === 0 && hi === STOPS.length - 1) {
      onChange(keep);
      return;
    }
    onChange([...KEYS.slice(lo, hi), ...keep]);
  };

  const toggleZone = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const nearestStop = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const v = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    let best = 0;
    STOPS.forEach((s, i) => {
      if (Math.abs(s - v) < Math.abs(STOPS[best] - v)) best = i;
    });
    return best;
  };

  const onKey = (which: 0 | 1) => (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!range) return;
    const [lo, hi] = range;
    const current = which === 0 ? lo : hi;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - 1;
    else if (e.key === "Home") next = which === 0 ? 0 : lo + 1;
    else if (e.key === "End") next = which === 0 ? hi - 1 : STOPS.length - 1;
    if (next === null) return;
    e.preventDefault();
    if (which === 0) commitRange(Math.max(0, Math.min(next, hi - 1)), hi);
    else commitRange(lo, Math.min(STOPS.length - 1, Math.max(next, lo + 1)));
  };

  const jaw = (which: 0 | 1) => {
    if (!live) return null;
    const stop = live[which];
    return (
      <span
        role="slider"
        tabIndex={0}
        aria-label={which === 0 ? "Lowest float" : "Highest float"}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={STOPS[stop]}
        aria-valuetext={stopText(stop)}
        onKeyDown={onKey(which)}
        onPointerDown={(e: PointerEvent<HTMLSpanElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag({ which, stop });
        }}
        onPointerMove={(e: PointerEvent<HTMLSpanElement>) => {
          if (drag?.which === which) setDrag({ which, stop: nearestStop(e.clientX) });
        }}
        onPointerUp={() => {
          if (live) commitRange(live[0], live[1]);
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
        style={{ left: `${STOPS[stop] * 100}%` }}
        className="absolute bottom-[3px] z-[2] flex h-8 w-6 -translate-x-1/2 cursor-grab touch-none items-end justify-center active:cursor-grabbing"
      >
        <Jaw />
      </span>
    );
  };

  const readout = zoneKeys.length
    ? `${EXTERIORS.filter((e) => zoneKeys.includes(e.code.toLowerCase()))
        .map((e) => e.code)
        .join(", ")}${live ? ` · ${formatFloat(STOPS[live[0]])}–${formatFloat(STOPS[live[1]])}` : ""}`
    : "All exteriors · 0.00–1.00";

  return (
    <div className="pb-2">
      <div className="relative px-1.5">
        <div className="relative h-[52px]">
          {EXTERIORS.map((e, i) => (
            <span
              key={e.code}
              aria-hidden="true"
              className={cn(
                "absolute -translate-x-1/2 font-mono text-[0.75rem] leading-none [font-stretch:87.5%]",
                i % 2 === 0 ? "bottom-[22px]" : "bottom-[34px]",
                zoneKeys.includes(e.code.toLowerCase()) ? "font-semibold text-ink" : "text-ink-muted",
              )}
              style={{ left: `${((e.floatMin + e.floatMax) / 2) * 100}%` }}
            >
              {e.code}
            </span>
          ))}
        </div>
        <div ref={trackRef} className="relative">
          {EXTERIORS.map((e) => {
            const key = e.code.toLowerCase();
            const on = zoneKeys.includes(key);
            return (
              <button
                key={e.code}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => toggleZone(key)}
                className="absolute bottom-0 top-[-18px] cursor-pointer"
                style={{ left: `${e.floatMin * 100}%`, width: `${(e.floatMax - e.floatMin) * 100}%` }}
              >
                {on ? <span className="absolute inset-x-0 bottom-0 h-1.5 bg-ink/85 [[data-theme=light]_&]:bg-ink" /> : null}
              </button>
            );
          })}
          <RulerTicks className="pointer-events-none relative" />
          {range ? (
            <>
              {jaw(0)}
              {jaw(1)}
            </>
          ) : null}
        </div>
        <div className="h-px bg-rule" />
        <div className="relative h-5">
          {[0, 0.38, 1].map((b, i, arr) => (
            <span
              key={b}
              aria-hidden="true"
              className={cn("absolute top-1 font-mono text-[0.6875rem] leading-none text-ink-muted", i === 0 ? "" : i === arr.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}
              style={{ left: `${b * 100}%` }}
            >
              {b.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      <p className="m-0 mt-2 font-mono text-data text-ink" aria-live="polite">
        {readout}
      </p>
      <ul className="m-0 mt-3 list-none p-0">
        {EXTERIORS.map((e) => {
          const key = e.code.toLowerCase();
          const count = counts.get(key) ?? 0;
          const on = selected.includes(key);
          if (count === 0 && !on) return null;
          return (
            <li key={e.code}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${e.label}, ${formatFloat(e.floatMin)} to ${formatFloat(e.floatMax)}, ${count} skins`}
                onClick={() => toggleZone(key)}
                className={cn(
                  "relative flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-control pl-2.5 pr-1 text-left text-ui-md transition-colors duration-[140ms] touch-device:min-h-11",
                  on ? "bg-brand-soft text-ink shadow-[inset_2px_0_0_var(--color-accent)]" : "text-ink-muted hover-device:hover:text-ink",
                )}
              >
                <span className="w-6 font-mono text-[0.75rem] text-ink">{e.code}</span>
                <span className="flex-1">{e.label}</span>
                <span className="font-mono text-[0.75rem] text-ink-muted">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {notPainted && (notPainted.count > 0 || selected.includes(NOT_PAINTED)) ? (
        <Checkbox
          dense
          label="Not painted"
          description="Vanilla knives and gloves without a finish"
          count={notPainted.count}
          checked={selected.includes(NOT_PAINTED)}
          onChange={() => toggleZone(NOT_PAINTED)}
          wrapperClassName="mt-1"
        />
      ) : null}
    </div>
  );
}
