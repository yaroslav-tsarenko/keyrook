"use client";

import Link from "next/link";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import { SkinStage } from "@/components/skin/SkinStage";
import type { HomeWeaponType } from "./types";
import { SectionHead } from "./SectionHead";

const LAYOUT: Record<string, { span: string; row: 1 | 2 }> = {
  knives: { span: "col-span-2 sm:col-span-3 lg:col-span-5", row: 1 },
  gloves: { span: "col-span-2 sm:col-span-3 lg:col-span-4", row: 1 },
  rifles: { span: "sm:col-span-2 lg:col-span-3", row: 1 },
  "sniper-rifles": { span: "sm:col-span-2 lg:col-span-3", row: 2 },
  pistols: { span: "sm:col-span-2 lg:col-span-3", row: 2 },
  smgs: { span: "sm:col-span-2 lg:col-span-2", row: 2 },
  shotguns: { span: "sm:col-span-2 lg:col-span-2", row: 2 },
  "machine-guns": { span: "sm:col-span-2 lg:col-span-2", row: 2 },
};

function Bay({ type, index }: { type: HomeWeaponType; index: number }) {
  const { currency, convert } = useCurrency();
  const layout = LAYOUT[type.key] ?? { span: "sm:col-span-2 lg:col-span-2", row: 2 };
  const top = layout.row === 1;
  return (
    <li data-bay="" style={{ ["--i" as string]: index }} className={cn("min-w-0", layout.span)}>
      <Link href={`/catalog/${type.key}`} className="group/tray tray block h-full overflow-hidden [--rarity:transparent] hover-device:hover:-translate-y-[3px] hover-device:hover:shadow-card-hover">
        <SkinStage
          src={type.render?.images?.[0]?.url}
          alt=""
          aspect="4/3"
          sizes={top ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 24vw, 50vw"}
          className={cn("lg:aspect-auto", top ? "lg:h-[380px]" : "lg:h-[220px]")}
        />
        <div className="@container border-t border-line px-4 pb-4 pt-3.5">
          <div className={cn("flex flex-col gap-2", top && "@[17rem]:flex-row @[17rem]:items-end @[17rem]:justify-between @[17rem]:gap-3")}>
            <p className={cn("label-caps m-0 leading-none text-ink", top ? "text-step-2" : "text-step-1")}>{type.name}</p>
            <p className={cn("m-0 flex flex-wrap gap-x-3 font-mono text-[0.75rem] leading-[1.5] text-ink-muted", top && "@[17rem]:block @[17rem]:text-right")}>
              <span className={cn("text-ink", top && "@[17rem]:block")}>{type.count.toLocaleString("en-GB")} skins</span>
              {type.minPrice !== null ? <span className={cn(top && "@[17rem]:block")}>from {formatPrice(convert(type.minPrice), currency)}</span> : null}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function WeaponBays({ types }: { types: HomeWeaponType[] }) {
  if (types.length === 0) return null;
  const order = Object.keys(LAYOUT);
  const ordered = [...types].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return (
    <section aria-labelledby="bays-title" data-scene="bays" data-section="bays" className="mx-auto max-w-wide px-gutter pb-16 pt-16 lg:pb-20 lg:pt-14">
      <SectionHead id="bays-title" title="Shop by weapon" lead="Each bay holds one kind of weapon. Counts and starting prices are live." link={{ href: "/catalog", label: "All skins" }} />
      <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-6 lg:grid-cols-12 lg:gap-4">
        {ordered.map((type, i) => (
          <Bay key={type.key} type={type} index={i} />
        ))}
      </ul>
    </section>
  );
}
