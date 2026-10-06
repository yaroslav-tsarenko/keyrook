"use client";

import { useEffect, useState } from "react";
import { MERCH } from "@/config/merchandising";
import { SkinTray, type SkinProduct } from "./SkinTray";

const KEY = "patinaskins-viewed";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function useRecordView(id: string) {
  useEffect(() => {
    try {
      const next = [id, ...readIds().filter((v) => v !== id)].slice(0, MERCH.recentlyViewed + 1);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [id]);
}

export function RecordView({ id }: { id: string }) {
  useRecordView(id);
  return null;
}

export function RecentlyViewed({ excludeId, title = "Recently viewed", className }: { excludeId?: string; title?: string; className?: string }) {
  const [products, setProducts] = useState<SkinProduct[]>([]);

  useEffect(() => {
    const ids = readIds()
      .filter((id) => id !== excludeId)
      .slice(0, MERCH.recentlyViewed);
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/products/viewed?ids=${ids.join(",")}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: SkinProduct[] }) => {
        if (!cancelled) setProducts((body.data ?? []).filter((p) => p.quantity === undefined || p.quantity > 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed" data-section="recently-viewed" className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recently-viewed" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
          {title}
        </h2>
        <p className="m-0 text-ui-sm text-ink-muted">Kept on this device only</p>
      </div>
      <div className="no-scrollbar -mx-gutter mt-6 flex snap-x gap-3 overflow-x-auto px-gutter pb-2 lg:gap-4">
        {products.map((product) => (
          <div key={product.id} className="w-[min(72vw,280px)] shrink-0 snap-start lg:w-[calc((100%-3*16px)/4)]">
            <SkinTray product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
