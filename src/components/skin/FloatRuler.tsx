import type { ReactNode } from "react";
import { EXTERIORS, exteriorDef, formatFloat, type ExteriorCode } from "@/lib/skins/cs2";
import { cn } from "@/lib/utils/cn";

const BOUNDS = [0, ...EXTERIORS.map((e) => e.floatMax)];
const MAJOR = new Set(BOUNDS.map((b) => Math.round(b * 100)));
const CODE_ROW: Record<ExteriorCode, 0 | 1> = { FN: 0, MW: 1, FT: 0, WW: 1, BS: 0 };
const LABEL_ROW = [0, 1, 0, 0, 1, 0];

export function zoneOf(code: string | null | undefined) {
  return exteriorDef(code);
}

export function ZoneStrip({ exterior, className }: { exterior: string | null | undefined; className?: string }) {
  const code = exteriorDef(exterior)?.code ?? null;
  return (
    <span aria-hidden="true" data-zone-strip="" className={cn("inline-flex w-[72px] shrink-0 gap-0.5", className)}>
      {EXTERIORS.map((e) => (
        <span
          key={e.code}
          data-lit={e.code === code || undefined}
          className={cn("h-0.5 flex-1 bg-line-hover transition-colors duration-[140ms]", e.code === code && "bg-ink group-hover/tray:bg-brand group-focus-within/tray:bg-brand")}
        />
      ))}
    </span>
  );
}

function pct(v: number) {
  return `${v * 100}%`;
}

export function RulerTicks({ minor = true, className }: { minor?: boolean; className?: string }) {
  const ticks = Array.from({ length: 101 }, (_, i) => i);
  return (
    <svg aria-hidden="true" viewBox="0 0 1000 12" preserveAspectRatio="none" className={cn("block h-3 w-full overflow-visible", className)}>
      {ticks.map((i) => {
        const major = MAJOR.has(i);
        const mid = !major && i % 5 === 0;
        if (!major && !mid && !minor) return null;
        const h = major ? 12 : mid ? 7 : 4;
        return (
          <line
            key={i}
            x1={i * 10}
            x2={i * 10}
            y1={12}
            y2={12 - h}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            data-stroke=""
            pathLength={1}
            className={cn(major ? "stroke-ink" : mid ? "stroke-ink-subtle" : "stroke-line-hover max-sm:hidden")}
            style={{ ["--i" as string]: i }}
          />
        );
      })}
    </svg>
  );
}

export function Jaw({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 18" width={12} height={18} className={cn("block fill-brand", className)}>
      <path d="M0 0H12V12L6 18L0 12Z" />
    </svg>
  );
}

export interface CalibratedRulerProps {
  lit?: string[];
  jaw?: number | null;
  jawLabel?: ReactNode;
  labels?: boolean;
  codes?: boolean;
  minor?: boolean;
  readout?: ReactNode;
  decorative?: boolean;
  ariaLabel?: string;
  draw?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CalibratedRuler({
  lit = [],
  jaw = null,
  jawLabel,
  labels = true,
  codes = true,
  minor = true,
  readout,
  decorative = false,
  ariaLabel,
  draw = false,
  className,
  children,
}: CalibratedRulerProps) {
  const litSet = new Set(lit.map((c) => c.toUpperCase()));
  const zones = EXTERIORS.filter((e) => litSet.has(e.code));
  const label =
    ariaLabel ??
    (zones.length === 1 ? `Exterior ${zones[0].label}, float range ${formatFloat(zones[0].floatMin)} to ${formatFloat(zones[0].floatMax)}` : "Float scale from 0.00 to 1.00 with exterior zones");
  return (
    <div className={cn("min-w-0", className)} data-ruler="" data-draw={draw || undefined}>
      <div
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
        className="@container relative"
      >
        {codes ? (
          <div className={cn("relative", jaw !== null ? "h-[58px]" : "h-[30px]")}>
            {EXTERIORS.map((e) => {
              const on = litSet.has(e.code);
              return (
                <span
                  key={e.code}
                  className={cn(
                    "absolute -translate-x-1/2 font-mono text-[0.75rem] leading-none [font-stretch:87.5%]",
                    CODE_ROW[e.code] === 0 ? "bottom-1" : "bottom-[17px]",
                    on ? "font-semibold text-ink" : "font-medium text-ink-muted",
                  )}
                  style={{ left: pct((e.floatMin + e.floatMax) / 2) }}
                >
                  {e.code}
                </span>
              );
            })}
            {jaw !== null ? (
              <span data-jaw="" className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: pct(Math.min(1, Math.max(0, jaw))), ["--jaw" as string]: Math.min(1, Math.max(0, jaw)) }}>
                <span className="mb-1 whitespace-nowrap font-mono text-[0.75rem] leading-none text-ink">{jawLabel ?? jaw.toFixed(4)}</span>
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="relative">
          {zones.map((z) => (
            <span
              key={z.code}
              data-lit-band=""
              className="absolute bottom-0 h-1.5 bg-ink/85 [[data-theme=light]_&]:bg-ink"
              style={{ left: pct(z.floatMin), width: pct(z.floatMax - z.floatMin) }}
            />
          ))}
          <RulerTicks minor={minor} />
          {draw && zones.length === 1 ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-3 overflow-hidden">
              <span data-ruler-scan="" className="absolute inset-0" style={{ ["--scan-to" as string]: pct(zones[0].floatMax) }}>
                <span className="absolute bottom-0 left-0 h-3 w-px bg-ink" />
              </span>
            </span>
          ) : null}
          {jaw !== null ? (
            <span data-jaw="" className="absolute bottom-[3px] -translate-x-1/2" style={{ left: pct(Math.min(1, Math.max(0, jaw))), ["--jaw" as string]: Math.min(1, Math.max(0, jaw)) }}>
              <Jaw />
            </span>
          ) : null}
          {children}
        </div>
        <div data-ruler-base="" className="h-px origin-left bg-rule" />
        {labels ? (
          <div className="relative h-[34px]">
            {BOUNDS.map((b, i) => (
              <span
                key={b}
                className={cn(
                  "absolute font-mono text-[0.75rem] leading-none text-ink-muted",
                  i === 0 ? "translate-x-0" : i === BOUNDS.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                  LABEL_ROW[i] === 0 ? "top-1.5" : "top-[21px]",
                  (i === 1 || i === 4) && "@max-[28rem]:hidden",
                  i === 2 && "@max-[28rem]:top-[21px]",
                )}
                style={{ left: pct(b) }}
              >
                {b.toFixed(2)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {readout ? <p className="m-0 mt-1 font-mono text-data text-ink">{readout}</p> : null}
    </div>
  );
}

export function exteriorReadout(code: string | null | undefined): string | null {
  const e = exteriorDef(code);
  if (!e) return null;
  return `${e.label} · ${formatFloat(e.floatMin)}–${formatFloat(e.floatMax)}`;
}
