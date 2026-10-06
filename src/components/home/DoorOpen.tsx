import { getTranslations } from "next-intl/server";
import { SearchForm } from "@/components/search/SearchResults/SearchResults";
import { DoorContents } from "./DoorHero";
import { DoorPoster } from "./DoorPoster";
import { PlatformPlates } from "./parts";
import type { HomeData } from "./types";

export async function DoorOpen({ data }: { data: HomeData }) {
  const t = await getTranslations("home.open");
  const door = await getTranslations("home.door");
  return (
    <section id="door-open" aria-labelledby="door-open-title" data-home-section="door-open" data-scene="door-ajar" className="relative overflow-hidden bg-surface-2">
      <div className="mx-auto grid max-w-wide items-center gap-x-10 gap-y-12 px-gutter py-16 lg:min-h-[72vh] lg:grid-cols-12 lg:py-20">
        <div className="min-w-0 lg:col-span-7">
          <h2 id="door-open-title" data-anim="plate" className="m-0 text-step-6 leading-[0.98] tracking-[-0.015em] text-ink [font-weight:740]">
            {t("title")}
          </h2>
          <p className="m-0 mt-4 text-step-1 text-ink-muted">{t("line")}</p>
          <div className="mt-8 max-w-[620px]">
            <SearchForm query="" inputId="door-open-search" label={door("searchLabel")} placeholder={door("searchPlaceholder", { count: data.live.toLocaleString("en-GB") })} submit={door("searchSubmit")} />
          </div>
          <PlatformPlates platforms={data.platforms} label={door("platformsLabel")} className="mt-5 max-w-[720px]" />
        </div>
        <div className="min-w-0 lg:col-span-4 lg:col-start-9">
          <div data-door-ajar="" className="mx-auto w-[72vw] max-w-[420px] lg:w-full">
            <DoorPoster uid="cta-door" state="ajar" angle={34} interior={data.ctaCovers.length ? <DoorContents covers={data.ctaCovers} label={t("contentsLabel")} mobileLimit={6} parallax className="door-contents-small" /> : null} />
          </div>
        </div>
      </div>
    </section>
  );
}
