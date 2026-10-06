import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cover } from "@/components/product/Cover";
import { cn } from "@/lib/utils/cn";
import { ArrowLink, HomeHeading } from "./parts";
import type { HomeGenre } from "./types";

export async function GenreDirectory({ genres }: { genres: HomeGenre[] }) {
  if (genres.length < 6) return null;
  const t = await getTranslations("home.genres");
  const rows = Math.ceil(genres.length / 3);
  return (
    <section id="genres" aria-labelledby="genres-title" data-home-section="genres" className="border-y border-line bg-rig py-16 lg:py-24">
      <div className="mx-auto max-w-wide px-gutter">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <HomeHeading id="genres-title" title={t("title")} />
            <p className="m-0 mt-3 text-step-0 text-ink-muted">{t("lead")}</p>
          </div>
          <ArrowLink href="/catalog/games">{t("all")}</ArrowLink>
        </div>
        <ol
          data-scene="directory"
          className="mb-0 mt-10 grid list-none gap-x-10 border-t border-rule p-0 lg:mt-12 lg:grid-flow-col lg:grid-cols-3"
          style={{ gridTemplateRows: `repeat(${rows}, auto)` }}
        >
          {genres.map((g, i) => (
            <li key={g.key} className={cn("min-w-0 border-b border-line", i >= 12 && "max-lg:hidden")}>
              <Link href={g.href} data-directory-row="" data-peek-row="" aria-label={t("rowLabel", { label: g.label, count: g.count.toLocaleString("en-GB") })} className="directory-row group">
                <span className="label-caps min-w-0 truncate text-step-0 text-ink lg:text-step-1">{g.label}</span>
                <span aria-hidden="true" className="directory-track">
                  <span className="directory-rule" />
                  {g.covers.length ? (
                    <span data-directory-peek="" data-peek="" className="directory-peek">
                      {g.covers.map((c) => (
                        <span key={c.id} className="w-[30px]">
                          <Cover src={c.image} alt="" sizes="40px" compact />
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-data text-ink">{g.count.toLocaleString("en-GB")}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
