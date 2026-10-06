"use client";

import Link from "next/link";
import { EXTERIORS } from "@/lib/skins/cs2";
import { CalibratedRuler } from "@/components/skin/FloatRuler";
import { SkinStage } from "@/components/skin/SkinStage";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Plate } from "@/components/ui/Plate";
import { skinFace, type SkinProduct } from "@/components/skin/SkinTray";

export interface VariantRow {
  product: SkinProduct;
}

export function VariantLadder({ rows, title }: { rows: VariantRow[]; title: string }) {
  return (
    <section aria-labelledby="variants-title" data-section="variants" className="mt-16 lg:mt-24">
      <h2 id="variants-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
        {title}
      </h2>
      <div className="mt-6 hidden grid-cols-[minmax(0,300px)_minmax(0,1fr)_140px] gap-6 md:grid">
        <span />
        <CalibratedRuler decorative minor={false} />
        <span />
      </div>
      <ul className="m-0 list-none border-t border-line p-0 md:border-t-0">
        {rows.map(({ product }) => {
          const face = skinFace(product.name, product.skin);
          const zone = EXTERIORS.find((e) => e.code === face.exteriorCode);
          return (
            <li key={product.id} data-rarity={face.rarity} className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-line py-3 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)_140px]">
              <div className="flex min-w-0 items-center gap-4">
                <span className="relative block w-[96px] shrink-0 overflow-hidden rounded-tray">
                  <SkinStage src={product.images?.[0]?.url} alt="" compact sizes="96px" follow={false} />
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 z-[4] w-[3px] bg-rarity" />
                </span>
                <span className="min-w-0">
                  <Link href={`/product/${product.slug}`} className="block text-ui-md font-semibold text-ink decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline">
                    {face.exteriorLabel}
                  </Link>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {face.exteriorCode ? <span className="font-mono text-[0.75rem] text-ink-muted">{face.exteriorCode}</span> : null}
                    {face.stattrak ? <Plate variant="stattrak" size="sm">StatTrak™</Plate> : null}
                  </span>
                </span>
              </div>
              <div aria-hidden="true" className="relative hidden h-3 md:block">
                <span className="absolute inset-x-0 bottom-0 h-px bg-line-hover" />
                {zone ? <span className="absolute bottom-0 h-1.5 bg-ink/85 group-hover:bg-brand [[data-theme=light]_&]:bg-ink" style={{ left: `${zone.floatMin * 100}%`, width: `${(zone.floatMax - zone.floatMin) * 100}%` }} /> : null}
              </div>
              <div className="text-right">
                <PriceDisplay price={Number(product.price)} size="sm" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
