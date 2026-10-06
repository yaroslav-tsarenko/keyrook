import { cn } from "@/lib/utils/cn";
import { DialLoader } from "./Dial";

export interface ReadoutLoaderProps {
  label?: string;
  block?: boolean;
  className?: string;
}

export function ReadoutLoader({ label = "Loading", block = false, className }: ReadoutLoaderProps) {
  const loader = <DialLoader label={label} className={className} />;
  if (!block) return loader;
  return <div className="flex min-h-[100svh] items-start justify-center px-4 py-16">{loader}</div>;
}

export function SkeletonBar({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block h-3 bg-surface-1", className)} />;
}
