import { cn } from "@/lib/utils/cn";

export function Lamp({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-lamp={on ? "on" : "off"}
      className={cn("relative inline-block size-2 shrink-0 rounded-round", on ? "bg-lamp-on" : "bg-lamp-off ring-1 ring-control ring-inset", className)}
    >
      {on ? <span data-lamp-fill="" className="absolute inset-0 rounded-round bg-lamp-on" /> : null}
    </span>
  );
}

export function Pip({ className }: { className?: string }) {
  return <span aria-hidden="true" data-pip="" className={cn("inline-block size-1.5 shrink-0 bg-platform", className)} />;
}

export function Bolts({ size }: { size?: 6 | 8 }) {
  const style = size === 8 ? { ["--bolt" as string]: "8px" } : undefined;
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <span key={corner} data-bolt={corner} aria-hidden="true" style={style} />
      ))}
    </>
  );
}
