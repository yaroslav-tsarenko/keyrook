import Link from "next/link";
import { EXTERIORS, formatFloat } from "@/lib/skins/cs2";
import { CalibratedRuler, ZoneStrip } from "@/components/skin/FloatRuler";
import { SkinStage } from "@/components/skin/SkinStage";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { skinFace, type SkinProduct } from "@/components/skin/face";
import { MOTION_WALK, walkProgress } from "@/lib/motion/tokens";
import { Jaw } from "@/components/skin/FloatRuler";

export function WearWalk({ wear, skin }: { wear: { code: string; product: SkinProduct | null }[]; skin: string | null }) {
  if (wear.every((w) => !w.product)) return null;
  return (
    <section aria-labelledby="wear-title" data-pin="wear" data-section="wear" className="overflow-x-clip bg-surface-2">
      <div data-wear-stage="" className="mx-auto max-w-wide px-gutter py-24">
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow m-0 mb-3">Exterior</p>
            <h2 id="wear-title" className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
              Exterior zones on the float scale
            </h2>
          </div>
          <p className="m-0 max-w-[60ch] self-end text-step-0 leading-[1.6] text-ink-muted lg:col-span-6 lg:col-start-7">
            Float is a number from 0.00 to 1.00 fixed on each copy of a skin. The exterior name tells you which zone it falls in, and a lower float means less visible wear. We list the exterior and its range; the exact float of your copy shows in Steam after delivery.
          </p>
        </div>

        <div data-wear-track="" className="mt-14">
          <CalibratedRuler lit={["FT"]} decorative className="hidden md:block">
            {EXTERIORS.map((e) => (
              <span
                key={e.code}
                aria-hidden="true"
                data-walk-band=""
                className="absolute bottom-0 h-1.5 bg-ink/85 [[data-theme=light]_&]:bg-ink"
                style={{ left: `${e.floatMin * 100}%`, width: `${(e.floatMax - e.floatMin) * 100}%`, ["--from" as string]: walkProgress(e.floatMin), ["--to" as string]: e.floatMax >= 1 ? "200%" : walkProgress(e.floatMax) }}
              />
            ))}
            <span
              aria-hidden="true"
              data-walk-jaw=""
              className="pointer-events-none absolute inset-x-0 bottom-[3px] h-[18px]"
              style={{ ["--from" as string]: walkProgress(0), ["--to" as string]: walkProgress(1) }}
            >
              <Jaw className="absolute left-0 top-0 -translate-x-1/2" />
            </span>
          </CalibratedRuler>
          {skin ? (
            <p className="m-0 mt-6 font-mono text-data text-ink">
              Same skin, five exteriors: <span className="font-semibold">{skin}</span>
            </p>
          ) : null}
          <ol className="no-scrollbar -mx-gutter m-0 mt-5 flex snap-x list-none gap-3 overflow-x-auto px-gutter pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0">
            {wear.map(({ code, product }) => {
              const e = EXTERIORS.find((x) => x.code === code)!;
              const face = product ? skinFace(product.name, product.skin) : null;
              return (
                <li key={code} data-wear-zone={code} style={{ ["--from" as string]: walkProgress(e.floatMin), ["--to" as string]: `calc(${walkProgress(e.floatMin)} + ${MOTION_WALK.rise * 100}%)` }} className="w-[72vw] max-w-[280px] shrink-0 snap-start md:w-auto md:max-w-none">
                  <div className="flex items-baseline justify-between gap-2 border-b border-rule pb-2">
                    <span className="font-mono text-data font-semibold text-ink">{code}</span>
                    <span className="font-mono text-[0.75rem] text-ink-muted">
                      {formatFloat(e.floatMin)}–{formatFloat(e.floatMax)}
                    </span>
                  </div>
                  <p className="m-0 mt-2 flex items-center gap-2 text-ui-md text-ink">
                    <ZoneStrip exterior={code} />
                    {e.label}
                  </p>
                  {product && face ? (
                    <Link href={`/product/${product.slug}`} data-rarity={face.rarity} data-wear-card="" className="group relative mt-4 block">
                      <span className="relative block overflow-hidden rounded-tray">
                        <SkinStage src={product.images?.[0]?.url} alt={product.name} sizes="(min-width: 768px) 20vw, 72vw" follow={false} />
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 z-[4] w-[3px] bg-rarity" />
                      </span>
                      <span className="mt-2 flex items-baseline justify-between gap-2">
                        <span className="truncate text-ui-md text-ink decoration-1 underline-offset-4 group-hover:underline">{skin ? face.exteriorLabel : `${face.weaponLine} | ${face.name}`}</span>
                        <PriceDisplay price={Number(product.price)} size="sm" />
                      </span>
                    </Link>
                  ) : null}
                  <Link href={`/catalog?exterior=${code.toLowerCase()}`} className="mt-2 inline-flex min-h-10 items-center text-ui-sm font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                    All {e.label} skins
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
