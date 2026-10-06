"use client";

import { BadgeCheck, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Choice";
import { Input } from "@/components/ui/Field";
import { Plate } from "@/components/ui/Plate";
import { ACTIVATION } from "@/config/activation";
import { platformInfo } from "@/lib/catalog/platforms";
import { cn } from "@/lib/utils/cn";
import { defineScene } from "../define";
import { SampleCover } from "../sample-cover";
import type { SceneViewProps } from "../types";
import { SAMPLE_LIBRARY } from "./data";
import { fillCopy, sceneMeta, THEATER_COPY } from "./meta";

type Platform = keyof typeof ACTIVATION;
type S = { platform: string; menu: boolean; dialog: boolean; key: string; agreed: boolean; done: boolean; added: number };

const copy = THEATER_COPY.scenes.redeem;
const meta = sceneMeta("redeem");
const NEW_TITLE = "Lantern Coast";

function guideFor(platform: string) {
  return ACTIVATION[(platform in ACTIVATION ? platform : "steam") as Platform];
}

function LibraryRow({ title, fresh }: { title: string; fresh?: boolean }) {
  return (
    <li className={cn("flex items-center gap-3 border-b border-line px-3 py-2", fresh && "th-slide bg-brand-soft")}>
      <span className="block h-10 w-[30px] shrink-0 overflow-hidden bg-stage">
        <SampleCover title={title} compact />
      </span>
      <span className="min-w-0 truncate text-ui-sm text-ink">{title}</span>
      {fresh ? <span className="ml-auto font-mono text-[0.75rem] text-ink-muted">New</span> : null}
    </li>
  );
}

function View({ s, device, focus }: SceneViewProps<S>) {
  const phone = device === "phone";
  const guide = guideFor(s.platform);
  const tone = platformInfo(guide.platform).tone;
  const [top, item] = guide.menuPath.length > 1 ? guide.menuPath : [guide.menuPath[0], guide.menuPath[0]];
  return (
    <div className={cn("flex h-full flex-col bg-surface-1", phone ? "p-3" : "p-8")} data-platform={tone}>
      <div className="plate flex min-h-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 bg-platform" />
            <span className="eyebrow text-ink">{guide.name}</span>
          </span>
          <Plate variant="neutral" size="sm">
            Illustration
          </Plate>
        </div>
        <div className="relative flex h-10 shrink-0 items-center gap-1 border-b border-line bg-raised px-2">
          <span data-demo="menu-0" className={cn("inline-flex h-8 items-center gap-1.5 px-3 text-ui-sm font-[560]", s.menu ? "bg-plate text-ink shadow-machined" : "text-ink")}>
            {top}
            <ChevronDown size={14} aria-hidden="true" className="text-ink-muted" />
          </span>
          {s.menu ? (
            <div className="th-pop absolute left-2 top-10 z-10 min-w-[260px] bg-raised py-1 shadow-lg">
              <span data-demo="menu-1" className="flex h-10 items-center px-3 text-ui-sm text-ink">
                {item}
              </span>
            </div>
          ) : null}
        </div>
        <div className="relative flex min-h-0 flex-1">
          {phone ? null : (
            <aside className="w-[280px] shrink-0 border-r border-line">
              <p className="eyebrow m-0 px-3 pb-2 pt-3">{copy.library}</p>
              <ul className="m-0 list-none border-t border-line p-0">
                {s.added > 0 ? <LibraryRow title={NEW_TITLE} fresh /> : null}
                {SAMPLE_LIBRARY.map((t) => (
                  <LibraryRow key={t} title={t} />
                ))}
              </ul>
            </aside>
          )}
          <div className="flex min-w-0 flex-1 items-center justify-center p-4">
            {s.dialog ? (
              <div className="th-pop w-full max-w-[440px] bg-raised p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <p className="m-0 font-display text-step-2 font-[600] text-ink [font-stretch:112.5%]">{item}</p>
                  <X size={18} aria-hidden="true" className="text-ink-muted" />
                </div>
                {s.done ? (
                  <div className="mt-5 flex flex-col gap-3">
                    <p className="m-0 flex items-center gap-2 text-ui-md font-[560] text-ink">
                      <BadgeCheck size={20} aria-hidden="true" className="text-success" />
                      {copy.done}
                    </p>
                    <p className="m-0 text-ui-sm text-ink-muted">
                      {NEW_TITLE} · {copy.added}
                    </p>
                  </div>
                ) : (
                  <>
                    <span data-demo="key-field" className="mt-5 block">
                      <Input label={copy.fieldLabel} value={s.key} onChange={() => {}} mono className={cn("uppercase", focus === "key-field" && "border-ink")} />
                    </span>
                    {guide.agreement ? (
                      <span data-demo="agree" className="mt-3 block">
                        <Checkbox label={copy.agree} checked={s.agreed} onChange={() => {}} />
                      </span>
                    ) : null}
                    <div className="mt-5 flex justify-end">
                      <Button data-demo="confirm" isDisabled={!s.key || (guide.agreement && !s.agreed)}>
                        {copy.confirm}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="m-0 max-w-[36ch] text-center text-ui-sm text-ink-muted">{copy.illustration}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const steam = ACTIVATION.steam;

export const redeem = defineScene<S>({
  id: "redeem",
  title: meta.title,
  summary: meta.summary,
  url: (s) => fillCopy(copy.url, guideFor(s.platform).platform as Platform),
  device: "desktop",
  initial: { platform: "steam", menu: false, dialog: false, key: "", agreed: false, done: false, added: 0 },
  View,
  script: ({ caption, click, set, wait, tween }) => [
    caption(meta.captions[0]!),
    click("menu-0", { menu: true }),
    click("menu-1", { menu: false, dialog: true }),
    caption(meta.captions[1]!),
    click("key-field"),
    set({ key: THEATER_COPY.scenes.decrypt.key }),
    wait(500),
    steam.agreement && click("agree", { agreed: true }),
    click("confirm", { done: true }),
    caption(meta.captions[2]!),
    tween("added", 1, 900),
    wait(1400),
  ],
});
