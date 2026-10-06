"use client";

import { KeyPlate } from "@/components/account/KeyPlate";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { Lamp } from "@/components/ui/Lamp";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { SAMPLE_ORDER } from "./data";
import { DemoHeader } from "./kit";
import { sceneMeta, THEATER_COPY } from "./meta";

type S = { issue: number; status: string; masked: boolean; decrypt: number; copied: boolean };

const copy = THEATER_COPY.scenes.decrypt;
const meta = sceneMeta("decrypt");
const NAV = ["Overview", "Keys", "Orders", "Pinned", "Profile"];

export function AccountNav() {
  return (
    <nav className="w-[200px] shrink-0 border-r border-line pr-6">
      <ul className="m-0 list-none p-0">
        {NAV.map((item) => (
          <li key={item} className={cn("flex min-h-10 items-center gap-2.5 text-ui-md", item === "Keys" ? "text-ink" : "text-ink-muted")}>
            {item === "Keys" ? <Lamp on /> : <span className="w-2" />}
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function View({ s, device }: SceneViewProps<S>) {
  const phone = device === "phone";
  const issued = s.status === "issued";
  return (
    <div className="flex h-full flex-col bg-surface">
      <DemoHeader device={device} />
      <div data-demo-scroll="page" className={cn("min-h-0 flex-1", phone ? "overflow-y-auto p-4" : "flex gap-8 overflow-hidden px-8 py-7")}>
        {phone ? null : <AccountNav />}
        <div className="min-w-0 flex-1">
          <p className="m-0 font-display text-step-5 font-[700] leading-none text-ink [font-stretch:112.5%]">{copy.heading}</p>
          <p className="m-0 mt-5 border-b border-rule pb-2 font-mono text-data text-ink-muted">
            {copy.order} · 6 Oct 2026
          </p>
          <OrderTimeline status={issued ? "delivered" : "paid"} createdAt={SAMPLE_ORDER.createdAt} paidAt={SAMPLE_ORDER.paidAt} finishedAt={issued ? SAMPLE_ORDER.issuedAt : null} demo className="mt-5 max-w-[720px]" />
          <div data-demo="plate" className="mt-6 max-w-[760px]">
            <KeyPlate
              keyId="sample"
              title={SAMPLE_ORDER.title}
              keyInfo={SAMPLE_ORDER.key}
              status={issued ? "ready" : "issuing"}
              issuedAt={issued ? SAMPLE_ORDER.issuedAt : null}
              demo
              demoValue={copy.key}
              demoState={{ masked: s.masked, decrypt: s.decrypt, copied: s.copied }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const decrypt = defineScene<S>({
  id: "decrypt",
  title: meta.title,
  summary: meta.summary,
  url: copy.url,
  device: "desktop",
  initial: { issue: 0, status: "paid", masked: true, decrypt: 0, copied: false },
  end: { decrypt: 1, copied: false },
  View,
  script: ({ caption, tween, set, highlight, click, wait }) => [
    caption(meta.captions[0]!),
    tween("issue", 1, 1400),
    set({ status: "issued" }),
    caption(meta.captions[1]!),
    highlight("plate", STORE_POLICY.security.keysEncryptedAtRest && !STORE_POLICY.security.keyInEmail ? copy.tipPlate : copy.tipPlatePlain),
    click("reveal", { masked: false }),
    tween("decrypt", 1, 1600, { ease: "out" }),
    caption(meta.captions[2]!),
    click("copy", { copied: true }),
    wait(900),
    highlight("redeem", copy.tipRedeem),
    wait(800),
  ],
});
