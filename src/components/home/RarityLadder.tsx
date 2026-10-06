import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SkinStage } from "@/components/skin/SkinStage";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { skinFace } from "@/components/skin/face";
import type { HomeRarityTier } from "./types";

export function RarityLadder({ tiers }: { tiers: HomeRarityTier[] }) {
  if (tiers.every((t) => t.count === 0)) return null;
  return (
    <section aria-labelledby="rarity-title" data-scene="rarity-ladder" data-section="rarity" className="mx-auto max-w-wide px-gutter pb-24 pt-28 lg:pb-24 lg:pt-32">
      <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="rarity-title" className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
            Rarity, tier by tier
          </h2>
          <p className="m-0 mt-4 max-w-[40ch] text-step-0 leading-[1.6] text-ink-muted">
            Rarity is the drop tier the game assigns to a finish, from Consumer Grade up to the ★ items. It tells you how often a skin drops, not how good its condition is. That is what the exterior is for.
          </p>
        </div>
        <ol className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-8 p-0 sm:grid-cols-4 lg:col-span-8 lg:grid-cols-7 lg:gap-x-3">
          {tiers.map((tier, i) => {
            const face = tier.product ? skinFace(tier.product.name, tier.product.skin) : null;
            const empty = tier.count === 0;
            const body = (
              <>
                <span aria-hidden="true" data-spine="" className="absolute bottom-0 left-0 top-0 w-[3px] origin-bottom-left bg-rarity transition-[scale] duration-[140ms] ease-[var(--ease-instrument)] group-hover:scale-x-200 group-focus-visible:scale-x-200" />
                <span className="block min-h-[2.5em] font-mono text-[0.75rem] font-medium uppercase leading-[1.25] tracking-[0.06em] text-rarity [font-stretch:87.5%]">{tier.label}</span>
                <span className="mt-1 block font-mono text-[0.75rem] text-ink-muted">{empty ? "0 in stock" : `${tier.count.toLocaleString("en-GB")} in stock`}</span>
                {tier.product && face ? (
                  <span className="mt-4 block">
                    <span className="block overflow-hidden rounded-tray">
                      <SkinStage src={tier.product.images?.[0]?.url} alt="" compact sizes="160px" follow={false} />
                    </span>
                    <span className="mt-2 block truncate font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-muted">{face.weaponLine}</span>
                    <span className="mt-0.5 line-clamp-2 block font-display text-[1rem] font-semibold leading-[1.15] text-ink decoration-1 underline-offset-4 group-hover:underline">
                      {face.name}
                    </span>
                    <PriceDisplay price={Number(tier.product.price)} size="sm" className="mt-1 [&_[data-price]]:text-data" />
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={tier.slug} data-rarity={tier.slug} style={{ ["--i" as string]: i }} className={cn("min-w-0", empty && "opacity-60")}>
                {empty ? (
                  <div className="relative block min-h-[120px] pl-4">{body}</div>
                ) : (
                  <Link href={`/catalog?rarity=${tier.keys.join(",")}`} className="group relative block min-h-[120px] pl-4">
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
