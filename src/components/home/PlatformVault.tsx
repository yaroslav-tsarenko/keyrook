import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cover } from "@/components/product/Cover";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Lamp } from "@/components/ui/Lamp";
import { Tumbler } from "@/components/ui/Tumbler";
import { cn } from "@/lib/utils/cn";
import { HomeHeading } from "./parts";
import type { HomePlatform } from "./types";

function span(rank: number) {
  if (rank === 1) return "lg:col-span-4";
  if (rank <= 3) return "lg:col-span-3";
  return "lg:col-span-2";
}

function Locker({ p, keysLabel, fromLabel, label }: { p: HomePlatform; keysLabel: string; fromLabel: string; label: string }) {
  const wide = p.rank <= 3;
  return (
    <li data-platform={p.tone} className={cn("min-w-0", p.rank === 1 && "max-lg:col-span-2", span(p.rank))}>
      <Link href={p.href} aria-label={label} data-locker="" data-rank={p.rank} data-ajar={p.rank <= 2 ? "" : undefined} className="locker group">
        <span data-locker-inside="" data-locker-covers="" data-depth="D3" className="locker-inside" aria-hidden="true">
          {p.covers.map((c) => (
            <span key={c.id} className="locker-cover">
              <Cover src={c.image} alt="" sizes="120px" />
            </span>
          ))}
        </span>
        <span data-locker-door="" data-depth="D2" className="locker-door">
          <span className="flex flex-col gap-3">
            <span className="flex items-center justify-between gap-3">
              <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
              <Lamp on={false} className="locker-lamp" />
            </span>
            <span className={cn("label-caps block min-w-0 pr-4 leading-[1.1] text-ink text-shadow-engrave", wide ? "text-step-0 lg:text-step-2" : "text-[0.8125rem] lg:text-step-0")}>{p.short}</span>
          </span>
          <span aria-hidden="true" className="locker-vents">
            {Array.from({ length: wide ? 9 : 6 }, (_, i) => (
              <span key={i} />
            ))}
          </span>
          <span className="flex flex-col gap-2" data-depth="D4">
            <span className="flex items-baseline gap-2">
              <Tumbler value={p.count} size={wide ? "md" : "sm"} label={`${p.count.toLocaleString("en-GB")} ${keysLabel}`} motion />
              <span className="eyebrow">{keysLabel}</span>
            </span>
            {p.minPrice !== null ? (
              <span className="flex items-baseline gap-2 font-mono text-data text-ink-muted">
                {fromLabel}
                <PriceDisplay price={p.minPrice} size="sm" className="[&_[data-price]]:text-ui-md [&_[data-price]]:text-ink" />
              </span>
            ) : null}
          </span>
          <span aria-hidden="true" className="locker-handle" />
        </span>
      </Link>
    </li>
  );
}

export async function PlatformVault({ platforms }: { platforms: HomePlatform[] }) {
  if (!platforms.length) return null;
  const t = await getTranslations("home.vault");
  return (
    <section id="platforms" aria-labelledby="platforms-title" data-home-section="platform-vault" className="bg-surface pb-16 pt-20 lg:pb-24 lg:pt-28">
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-4 px-gutter lg:grid-cols-12 lg:items-end">
        <HomeHeading id="platforms-title" title={t("title")} className="lg:col-span-6" />
        <p className="m-0 max-w-[52ch] text-step-1 leading-[1.5] text-ink-muted lg:col-span-6 lg:col-start-7">{t("lead")}</p>
      </div>
      <ul data-scene="lockers" className="mx-auto mb-0 mt-10 grid max-w-wide list-none grid-cols-2 gap-2.5 px-gutter lg:mt-14 lg:grid-cols-12 lg:gap-4">
        {platforms.map((p) => (
          <Locker key={p.key} p={p} keysLabel={t("keys")} fromLabel={t("from")} label={t("lockerLabel", { name: p.name, count: p.count.toLocaleString("en-GB") })} />
        ))}
      </ul>
    </section>
  );
}
