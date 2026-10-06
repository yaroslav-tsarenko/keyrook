"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ACTIVATION } from "@/config/activation";
import { platformInfo } from "@/lib/catalog/platforms";
import { ActivationStepList, RedeemLink } from "@/components/product/ActivationSteps";
import { MiniStill } from "@/components/theater/mini-still";
import { Lamp } from "@/components/ui/Lamp";
import { cn } from "@/lib/utils/cn";
import { ArrowLink, HomeHeading } from "./parts";

type Key = keyof typeof ACTIVATION;

export function ActivationSelector({ platforms }: { platforms: string[] }) {
  const t = useTranslations("home.activation");
  const keys = platforms.filter((p): p is Key => p in ACTIVATION);
  const [active, setActive] = useState<Key>(keys[0] ?? "steam");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const guide = ACTIVATION[active];
  const info = platformInfo(active);

  const move = (index: number) => {
    const next = (index + keys.length) % keys.length;
    setActive(keys[next]!);
    refs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") move(i + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(keys.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <section id="activation" aria-labelledby="activation-title" data-home-section="activation" className="bg-surface-1 py-16 lg:py-24">
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-10 px-gutter lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <HomeHeading id="activation-title" title={t("title")} />
          <p className="m-0 mt-4 max-w-[44ch] text-step-0 leading-[1.55] text-ink-muted">{t("lead")}</p>
          <div role="radiogroup" aria-label={t("choose")} className="no-scrollbar -mx-gutter mt-8 flex gap-0 overflow-x-auto px-gutter max-lg:pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:border-t lg:border-rule lg:px-0">
            {keys.map((k, i) => {
              const on = k === active;
              const p = platformInfo(k);
              return (
                <button
                  key={k}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(k)}
                  onKeyDown={(e) => onKey(e, i)}
                  data-platform={p.tone}
                  className={cn(
                    "flex min-h-11 shrink-0 cursor-pointer items-center gap-3 border-line px-3 text-left transition-colors duration-[120ms] max-lg:border max-lg:-ml-px max-lg:first:ml-0 lg:min-h-12 lg:border-b",
                    on ? "bg-plate text-ink shadow-machined" : "text-ink-muted hover-device:hover:bg-raised hover-device:hover:text-ink",
                  )}
                >
                  <Lamp on={on} />
                  <span aria-hidden="true" className="size-1.5 shrink-0 bg-platform" />
                  <span className="label-caps whitespace-nowrap text-[0.8125rem]">{p.short}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-w-0 lg:col-span-4" aria-live="polite">
          <p className="eyebrow m-0">{t("need")}</p>
          <p className="m-0 mt-2 text-step-1 leading-[1.4] text-ink">{guide.need.charAt(0).toUpperCase() + guide.need.slice(1)}</p>
          <p className="eyebrow m-0 mt-6 mb-1">{t("steps", { name: guide.name })}</p>
          <ActivationStepList key={active} guide={guide} className="border-t border-rule" />
          {guide.codeFormat ? <p className="m-0 mt-3 font-mono text-data text-ink-muted">{guide.codeFormat}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <RedeemLink guide={guide} />
            <ArrowLink href={`/how-activation-works#${info.slug}`}>{t("guide", { name: guide.name })}</ArrowLink>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-4">
          <MiniStill scene="redeem" state={{ platform: active }} device="phone" className="th-mini-narrow" address={`${guide.name} app`} label={t("stillLabel", { name: guide.name })} />
        </div>
      </div>
    </section>
  );
}
