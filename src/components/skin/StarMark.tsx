import { cn } from "@/lib/utils/cn";

export function StarMark({ size = 10, className, label = false }: { size?: number; className?: string; label?: boolean }) {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 20 20" width={size} height={size} className={cn("inline-block shrink-0 fill-rarity-gold", className)}>
        <path d="M10 0.8l2.7 6.1 6.6.6-5 4.4 1.5 6.5L10 15l-5.8 3.4 1.5-6.5-5-4.4 6.6-.6z" />
      </svg>
      {label ? <span className="sr-only">Star item</span> : null}
    </>
  );
}
