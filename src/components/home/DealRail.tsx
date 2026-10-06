"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DepositBox, type CatalogProduct } from "@/components/product/ProductCard";

export function DealRail({ products, labels }: { products: CatalogProduct[]; labels: { rail: string; previous: string; next: string; position: string } }) {
  const ref = useRef<HTMLUListElement>(null);
  const [range, setRange] = useState({ from: 1, to: Math.min(2, products.length) });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const left = el.scrollLeft;
    const right = left + el.clientWidth;
    let from = 0;
    let to = 0;
    items.forEach((item, i) => {
      const a = item.offsetLeft - el.offsetLeft;
      const b = a + item.offsetWidth;
      if (a >= left - 4 && b <= right + 4) {
        if (!from) from = i + 1;
        to = i + 1;
      }
    });
    if (from) setRange({ from, to });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const width = first ? first.offsetWidth + 16 : el.clientWidth;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * width * Math.max(1, range.to - range.from + 1), behavior: reduced ? "auto" : "smooth" });
  };

  const position = labels.position.replace("{from}", String(range.from)).replace("{to}", String(range.to)).replace("{total}", String(products.length));

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-4 flex items-center justify-end gap-3 max-lg:hidden">
        <span aria-live="polite" className="mr-auto font-mono text-data text-ink-muted">
          {position}
        </span>
        <button type="button" onClick={() => step(-1)} disabled={range.from <= 1} aria-label={labels.previous} className="flex size-10 cursor-pointer items-center justify-center border border-control bg-plate text-ink shadow-machined transition-colors duration-[120ms] hover-device:hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-subtle">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => step(1)} disabled={range.to >= products.length} aria-label={labels.next} className="flex size-10 cursor-pointer items-center justify-center border border-control bg-plate text-ink shadow-machined transition-colors duration-[120ms] hover-device:hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-subtle">
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <ul ref={ref} aria-label={labels.rail} className="no-scrollbar -mx-gutter my-0 flex list-none snap-x snap-mandatory scroll-px-gutter gap-2.5 overflow-x-auto px-gutter py-1 lg:mx-0 lg:scroll-px-0 lg:gap-4 lg:px-0">
        {products.map((p) => (
          <li key={p.id} className="w-[72vw] max-w-[300px] shrink-0 snap-start lg:w-[calc((100%-1rem)/2)] lg:max-w-none">
            <DepositBox product={p} headingLevel={3} />
          </li>
        ))}
      </ul>
    </div>
  );
}
