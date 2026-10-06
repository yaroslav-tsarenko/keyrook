import { cn } from "@/lib/utils/cn";

export interface ReadoutLoaderProps {
  label?: string;
  block?: boolean;
  className?: string;
}

export function ReadoutLoader({ label = "Loading", block = false, className }: ReadoutLoaderProps) {
  const loader = (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <span aria-hidden="true" className="inline-flex gap-1 motion-reduce:hidden">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1 bg-line-hover [animation:readout-led_420ms_steps(1,end)_infinite]" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </span>
      <span className="meta hidden text-ink-muted motion-reduce:inline">{label}…</span>
      <span className="sr-only motion-reduce:hidden">{label}</span>
    </span>
  );
  if (!block) return loader;
  return <div className="flex items-center justify-center px-4 py-16">{loader}</div>;
}

export function SkeletonBar({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block h-3 rounded-[1px] bg-surface-1", className)} />;
}
