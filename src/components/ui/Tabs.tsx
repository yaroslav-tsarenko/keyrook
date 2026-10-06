"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Accordion, AccordionItem } from "./Accordion";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  value?: string;
  onChange?: (id: string) => void;
  label: string;
  accordionBelow?: "md" | "lg" | null;
  className?: string;
  panelClassName?: string;
}

export function Tabs({ items, defaultId, value, onChange, label, accordionBelow = "md", className, panelClassName }: TabsProps) {
  const baseId = useId();
  const [local, setLocal] = useState(defaultId ?? items[0]?.id);
  const active = value ?? local;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wide = useMediaQuery(accordionBelow === "lg" ? "(min-width: 1024px)" : "(min-width: 768px)", true);

  const select = (id: string) => {
    if (value === undefined) setLocal(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    select(items[next].id);
    tabRefs.current[next]?.focus();
  };

  if (accordionBelow && !wide) {
    return (
      <Accordion className={className}>
        {items.map((item) => (
          <AccordionItem key={item.id} title={item.label} defaultOpen={item.id === active} headingLevel={2}>
            {item.content}
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="no-scrollbar relative flex gap-8 overflow-x-auto border-b border-line">
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "label-caps relative h-12 shrink-0 cursor-pointer whitespace-nowrap text-[0.8125rem] transition-colors duration-[120ms]",
                selected ? "text-ink" : "text-ink-muted hover-device:hover:text-ink",
              )}
            >
              {item.label}
              {selected ? (
                <>
                  <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-rule" />
                  <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className={cn("animate-fade-in pt-8", panelClassName)}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
