"use client";

import { useId, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headingLevel?: 2 | 3 | 4;
  aside?: ReactNode;
  titleClassName?: string;
  panelClassName?: string;
  flush?: boolean;
  className?: string;
  id?: string;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headingLevel = 3,
  aside,
  titleClassName,
  panelClassName,
  flush = false,
  className,
  id,
}: AccordionItemProps) {
  const autoId = useId();
  const baseId = id || autoId;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div data-open={open || undefined} className={cn("relative border-b border-line", className)}>
      <Heading className="m-0 font-sans text-[length:inherit] font-normal tracking-normal">
        <button
          type="button"
          id={`${baseId}-trigger`}
          aria-expanded={open}
          aria-controls={`${baseId}-panel`}
          onClick={toggle}
          className={cn(
            "relative flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-3 text-left font-sans text-step-1 font-semibold leading-[1.3] text-ink",
            "before:absolute before:-left-px before:top-3 before:bottom-3 before:w-0.5 before:bg-brand before:opacity-0 before:transition-opacity before:duration-[140ms]",
            open && "before:opacity-100",
            flush ? "pl-0" : "pl-4",
            titleClassName,
          )}
        >
          <span className="min-w-0 flex-1">{title}</span>
          {aside ? <span className="shrink-0">{aside}</span> : null}
          {open ? <Minus size={18} aria-hidden="true" className="shrink-0 text-ink-muted" /> : <Plus size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />}
        </button>
      </Heading>
      <div
        id={`${baseId}-panel`}
        role="region"
        aria-labelledby={`${baseId}-trigger`}
        inert={!open}
        className={cn("grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-instrument)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="relative min-h-0 overflow-hidden">
          <div className={cn(flush ? "pb-5" : "px-4 pb-5 pt-1", panelClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-line", className)}>{children}</div>;
}
