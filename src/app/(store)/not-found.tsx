import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Tumbler } from "@/components/ui/Tumbler";
import { SearchForm } from "@/components/search/SearchResults/SearchResults";
import { platformInfo } from "@/lib/catalog/platforms";

function NotFoundDial() {
  const size = 200;
  const c = size / 2;
  const r = 88;
  const ticks = Array.from({ length: 100 }, (_, i) => i);
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0" data-dial="404">
      <circle cx={c} cy={c} r={r + 6} fill="none" stroke="var(--color-border)" strokeWidth="1" />
      {ticks.map((i) => {
        const major = i % 10 === 0;
        const mid = i % 5 === 0;
        return <rect key={i} x={c - (major ? 1 : 0.5)} y={c - r} width={major ? 2 : 1} height={major ? 12 : mid ? 8 : 4} fill={major ? "var(--color-text-secondary)" : "var(--color-border-hover)"} transform={`rotate(${i * 3.6} ${c} ${c})`} />;
      })}
      <circle cx={c} cy={c} r={r * 0.62} fill="var(--color-plate)" stroke="var(--color-border-control)" strokeWidth="1" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={c - 0.75} y={c - r * 0.62} width="1.5" height="6" fill="var(--color-border-hover)" transform={`rotate(${i * 15} ${c} ${c})`} />
      ))}
      <g transform={`rotate(90 ${c} ${c})`}>
        <rect x={c - 1} y={c - r - 8} width="2" height="20" fill="var(--color-accent)" />
      </g>
    </svg>
  );
}

export default async function NotFound() {
  const t = await getTranslations("errors");
  const rows = await prisma.keyItem
    .groupBy({ by: ["platform"], where: { platform: { not: "other" }, product: { status: "ACTIVE", quantity: { gt: 0 } } }, _count: { _all: true } })
    .catch(() => []);
  const platforms = rows.sort((a, b) => b._count._all - a._count._all).map((r) => platformInfo(r.platform));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24 pt-12 lg:pt-20">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="flex items-center gap-6 lg:col-span-5 lg:pt-4">
          <NotFoundDial />
          <Tumbler value="404" size="lg" label="Error 404" motion />
        </div>
        <div className="lg:col-span-7">
          <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{t("notFoundTitle")}</h1>
          <p className="m-0 mt-3 max-w-[46ch] text-step-1 leading-[1.5] text-ink-muted">{t("notFoundSubtitle")}</p>
          <div className="mt-8 max-w-[34rem]">
            <SearchForm query="" label="Search keys" placeholder="Search keys: title, platform or genre" submit="Search" />
          </div>
          {platforms.length ? (
            <nav aria-label="Platforms" className="mt-8">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {platforms.map((p) => (
                  <li key={p.key} data-platform={p.tone}>
                    <Link href={`/platform/${p.slug}`} className="plate inline-flex h-11 items-center gap-2 px-3.5 hover-device:hover:bg-raised">
                      <span aria-hidden="true" className="size-1.5 bg-platform" />
                      <span className="eyebrow text-ink">{p.short}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <Link href="/" className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-ui-md font-[560] text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
