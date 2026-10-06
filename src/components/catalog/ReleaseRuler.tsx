import { TickBand } from "@/components/ui/Dial";

export interface ReleaseWeek {
  start: string;
  count: number;
}

function label(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
}

export function ReleaseRuler({ weeks, className }: { weeks: ReleaseWeek[]; className?: string }) {
  const peak = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((a, w) => a + w.count, 0);
  return (
    <figure data-release-ruler="" className={className} aria-label={`${total} releases in the last ${weeks.length} weeks`}>
      <div className="relative">
        <ol aria-hidden="true" className="m-0 grid h-16 list-none items-end gap-0 p-0" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {weeks.map((w) => (
            <li key={w.start} className="flex h-full items-end justify-center">
              <span className="block w-1.5 bg-ink-muted" style={{ height: `${w.count ? Math.max(8, (w.count / peak) * 100) : 0}%` }} />
            </li>
          ))}
        </ol>
        <div className="relative h-3">
          <TickBand className="absolute inset-x-0 bottom-px" major={false} />
          <span className="absolute inset-x-0 bottom-0 h-px bg-rule" />
          {weeks.map((w, i) => (
            <span key={w.start} aria-hidden="true" className="absolute bottom-0 h-3 w-px bg-ink-subtle" style={{ left: `${(i / weeks.length) * 100}%` }} />
          ))}
          <span aria-hidden="true" className="absolute bottom-0 right-0 h-3.5 w-0.5 bg-brand" />
        </div>
        <ol className="m-0 mt-2 grid list-none p-0 font-mono text-[0.75rem] text-ink-muted" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {weeks.map((w, i) => (
            <li key={w.start} className="truncate pr-1">
              <span className="max-sm:hidden">{label(w.start)}</span>
              <span className="sm:hidden">{i % 2 === 0 ? label(w.start) : ""}</span>
              <span className="sr-only">: {w.count} releases</span>
            </li>
          ))}
        </ol>
        <span aria-hidden="true" className="absolute right-0 top-0 -translate-y-full pb-1 font-mono text-[0.75rem] text-ink">
          Today
        </span>
      </div>
    </figure>
  );
}
