import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function TickBand({ className, major = true, tone = "default" }: { className?: string; major?: boolean; tone?: "default" | "faint" }) {
  const id = `tk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const minor = tone === "faint" ? "var(--color-border)" : "var(--color-border-hover)";
  return (
    <svg aria-hidden="true" className={cn("block h-2 w-full", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="40" height="8" patternUnits="userSpaceOnUse">
          <rect x="0" y="4" width="1" height="4" fill={minor} />
          <rect x="8" y="4" width="1" height="4" fill={minor} />
          <rect x="16" y="4" width="1" height="4" fill={minor} />
          <rect x="24" y="4" width="1" height="4" fill={minor} />
          <rect x="32" y="4" width="1" height="4" fill={minor} />
          {major ? <rect x="0" y="0" width="1" height="8" fill="var(--color-text-tertiary)" /> : null}
        </pattern>
      </defs>
      <rect width="100%" height="8" fill={`url(#${id})`} />
    </svg>
  );
}

export function DialLoader({ size = 24, label = "Loading", className, showLabel = false }: { size?: 16 | 24; label?: string; className?: string; showLabel?: boolean }) {
  const ticks = Array.from({ length: 12 }, (_, i) => i);
  const tickH = size === 16 ? 3.5 : 5;
  const tickW = size === 16 ? 1.5 : 2;
  return (
    <span role="status" data-dial-loader="" className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden="true" className="relative inline-block shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="absolute inset-0">
          {ticks.map((i) => (
            <rect key={i} x={size / 2 - tickW / 2} y={0.5} width={tickW} height={tickH} fill="var(--color-border-hover)" transform={`rotate(${i * 30} ${size / 2} ${size / 2})`} />
          ))}
        </svg>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="absolute inset-0 animate-dial-step">
          <rect x={size / 2 - tickW / 2} y={0.5} width={tickW} height={tickH} fill="var(--color-accent)" />
        </svg>
      </span>
      <span className={cn("meta text-ink-muted", showLabel ? "" : "sr-only motion-reduce:not-sr-only")}>{showLabel ? label : `${label}…`}</span>
    </span>
  );
}

export interface RulerDetent {
  key: string;
  label: ReactNode;
  done?: boolean;
}

export function DialRuler({
  detents,
  active,
  className,
  compactLabels = false,
  doneIcon,
}: {
  detents: RulerDetent[];
  active: number;
  className?: string;
  compactLabels?: boolean;
  doneIcon?: ReactNode;
}) {
  const last = Math.max(1, detents.length - 1);
  const pct = (i: number) => (i / last) * 100;
  return (
    <div aria-hidden="true" data-dial-ruler="" data-index={active} className={cn("relative select-none", className)}>
      <div className="relative h-4">
        <TickBand className="absolute inset-x-0 bottom-px" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-rule" />
        {detents.map((d, i) => (
          <span key={d.key} className="absolute bottom-0 h-3 w-px -translate-x-1/2 bg-ink" style={{ left: `${pct(i)}%` }} />
        ))}
        <span
          data-index-line=""
          className="absolute bottom-0 h-3.5 w-0.5 -translate-x-1/2 bg-brand transition-[left] duration-[260ms] ease-[var(--ease-latch)]"
          style={{ left: `${pct(active)}%` }}
        />
      </div>
      <ol className="relative m-0 mt-2.5 flex list-none justify-between p-0">
        {detents.map((d, i) => {
          const state = i < active ? "done" : i === active ? "current" : "upcoming";
          return (
            <li
              key={d.key}
              data-state={state}
              className={cn(
                "label-caps flex min-w-0 items-center gap-1.5 text-[0.75rem] leading-none",
                i === 0 ? "justify-start text-left" : i === detents.length - 1 ? "justify-end text-right" : "justify-center text-center",
                state === "current" ? "text-ink" : state === "done" ? "text-ink-muted" : "text-ink-subtle",
                compactLabels && state !== "current" && "max-sm:hidden",
                compactLabels && state === "current" && "max-sm:flex-1 max-sm:justify-start",
              )}
            >
              {state === "done" && doneIcon ? doneIcon : null}
              <span className="font-mono font-medium normal-case tracking-normal [font-stretch:100%]">
                {String(i + 1).padStart(2, "0")}
                {compactLabels ? <span className="hidden text-ink-subtle max-sm:inline">{` / ${String(detents.length).padStart(2, "0")}`}</span> : null}
              </span>
              <span className="truncate">{d.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
