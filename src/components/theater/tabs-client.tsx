"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Lamp } from "@/components/ui/Lamp";
import { cn } from "@/lib/utils/cn";
import { TheaterStage, type StageLabels } from "./stage";
import type { BoxKind } from "./still";
import { useTheaterSync } from "./sync";
import type { SceneId, TheaterDevice } from "./types";

export type TabMeta = {
  scene: SceneId;
  label: string;
  title: string;
  captions: string[];
  box: BoxKind;
  device: TheaterDevice;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TheaterTabsClient({ tabs, poster, label, labels, className }: { tabs: TabMeta[]; poster: ReactNode; label: string; labels: StageLabels; className?: string }) {
  const sync = useTheaterSync();
  const requested = useSearchParams().get("scene");
  const [active, setActive] = useState(() => Math.max(0, tabs.findIndex((t) => t.scene === requested)));
  const [touched, setTouched] = useState(() => tabs.some((t, i) => i > 0 && t.scene === requested));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const tab = tabs[active]!;
  const chapter = sync?.chapter ?? -1;
  const setScene = sync?.setScene;

  useEffect(() => {
    setScene?.(tab.scene);
  }, [tab.scene, setScene]);

  useEffect(() => {
    const el = refs.current[active];
    const list = listRef.current;
    if (!el || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  const go = (i: number, focus = false) => {
    const next = (i + tabs.length) % tabs.length;
    setActive(next);
    setTouched(true);
    if (focus) refs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1, true);
    else if (e.key === "ArrowLeft") go(active - 1, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(tabs.length - 1, true);
    else return;
    e.preventDefault();
  };

  const advance = useCallback(() => {
    window.setTimeout(() => setActive((a) => (a + 1) % tabs.length), 900);
  }, [tabs.length]);

  return (
    <div className={className} data-theater-tabs="">
      <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKey} className="th-tabs no-scrollbar">
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.scene}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`th-tab-${t.scene}`}
              aria-selected={on}
              aria-controls={`th-panel-${t.scene}`}
              tabIndex={on ? 0 : -1}
              onClick={() => go(i)}
              data-active={on || undefined}
              className="th-tab"
            >
              <span className="flex items-center gap-2.5">
                <Lamp on={on} />
                <span aria-hidden="true" className="inline-flex text-[0.75rem]">
                  <span className="tumbler-slot">{pad(i + 1)[0]}</span>
                  <span className="tumbler-slot">{pad(i + 1)[1]}</span>
                </span>
                <span className={cn("label-caps text-[0.8125rem]", on ? "text-ink" : "text-ink-muted")}>{t.label}</span>
              </span>
              <span aria-hidden="true" className="th-tab-ruler">
                {t.captions.map((c, ci) => (
                  <span key={c} data-lit={on && chapter >= ci ? "" : undefined} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`th-panel-${tab.scene}`} aria-labelledby={`th-tab-${tab.scene}`} className="mt-5">
        <TheaterStage
          key={tab.scene}
          sceneId={tab.scene}
          device={tab.device}
          box={tab.box}
          title={tab.title}
          captions={tab.captions}
          labels={labels}
          poster={active === 0 ? poster : undefined}
          eager={touched}
          loop={false}
          external
          onFinish={advance}
        />
      </div>
    </div>
  );
}
