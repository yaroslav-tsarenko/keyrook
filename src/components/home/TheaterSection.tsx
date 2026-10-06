import { getTranslations } from "next-intl/server";
import { TheaterTabs } from "@/components/theater/tabs";
import { ActiveSceneSteps, TheaterSync } from "@/components/theater/sync";
import { enabledScenes } from "@/components/theater/scenes/meta";
import { ArrowLink, HomeHeading } from "./parts";

export async function TheaterSection() {
  const t = await getTranslations("home.theater");
  const scenes = enabledScenes().map((s) => ({ id: s.id, captions: s.captions }));
  if (!scenes.length) return null;
  return (
    <section id="theater" aria-labelledby="theater-title" data-home-section="theater" className="bg-surface pb-20 pt-20 lg:pb-28 lg:pt-32">
      <TheaterSync>
        <div className="mx-auto grid max-w-wide gap-x-12 gap-y-10 px-gutter lg:grid-cols-12">
          <div className="lg:col-span-4">
            <HomeHeading id="theater-title" eyebrow={t("eyebrow")} title={t("title")} />
            <p className="m-0 mt-5 max-w-[48ch] text-step-1 leading-[1.5] text-ink-muted">{t("lead")}</p>
            <ActiveSceneSteps scenes={scenes} className="mt-8 max-lg:hidden" />
            <ArrowLink href="/how-activation-works" className="mt-6 max-lg:hidden">
              {t("link")}
            </ArrowLink>
          </div>
          <div className="min-w-0 lg:col-span-8">
            <TheaterTabs />
          </div>
          <div className="lg:hidden">
            <ActiveSceneSteps scenes={scenes} />
            <ArrowLink href="/how-activation-works" className="mt-4">
              {t("link")}
            </ArrowLink>
          </div>
        </div>
      </TheaterSync>
    </section>
  );
}
