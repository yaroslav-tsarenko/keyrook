"use client";

import { ChevronDown, X } from "lucide-react";
import { KeyPlate } from "@/components/account/KeyPlate";
import { Button } from "@/components/ui/Button";
import { Textarea, controlClass } from "@/components/ui/Field";
import { DialLoader } from "@/components/ui/Dial";
import { Lamp } from "@/components/ui/Lamp";
import { Plate } from "@/components/ui/Plate";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { SAMPLE_ORDER } from "./data";
import { DemoHeader } from "./kit";
import { AccountNav } from "./decrypt";
import { fillCopy, sceneMeta, THEATER_COPY } from "./meta";

type S = { open: boolean; list: boolean; reason: string; note: string; sent: boolean; review: number; outcome: string };

const copy = THEATER_COPY.scenes.support;
const meta = sceneMeta("support");

function ReportDialog({ s, focus }: { s: S; focus: string | null }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-scrim p-4">
      <div className="th-pop w-full max-w-[520px] bg-raised p-7 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <p className="m-0 font-display text-step-2 font-[600] leading-[1.15] text-ink [font-stretch:112.5%]">{copy.dialogTitle}</p>
          <X size={18} aria-hidden="true" className="text-ink-muted" />
        </div>
        <p className="m-0 mt-2 text-ui-sm text-ink-muted">
          We check it and reply {STORE_POLICY.support.replyTime}. {STORE_POLICY.guarantee.headline}.
        </p>
        <div className="mt-5 flex flex-col gap-1.5">
          <span className="text-ui-md font-[560] text-ink">
            {copy.reasonLabel}
            <span className="text-ink-muted"> *</span>
          </span>
          <div className="relative">
            <span data-demo="reason" className={cn(controlClass, "flex h-12 items-center justify-between px-3.5", s.list && "border-ink")}>
              <span className={s.reason ? "text-ink" : "text-ink-subtle"}>{s.reason || copy.reasonPlaceholder}</span>
              <ChevronDown size={16} aria-hidden="true" className="text-ink-muted" />
            </span>
            {s.list ? (
              <ul className="th-pop absolute inset-x-0 top-[calc(100%+4px)] z-10 m-0 list-none bg-raised py-1 shadow-lg">
                {copy.reasons.map((r, i) => (
                  <li key={r} data-demo={i === 0 ? "reason-redeemed" : undefined} className="flex h-10 items-center px-3.5 text-ui-md text-ink">
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <span data-demo="note" className="mt-4 block">
          <Textarea label={copy.noteLabel} value={s.note} onChange={() => {}} rows={3} className={cn("min-h-[96px]", focus === "note" && "border-ink")} />
        </span>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline">{copy.cancel}</Button>
          <Button data-demo="send" isDisabled={!s.reason}>
            {copy.send}
          </Button>
        </div>
      </div>
    </div>
  );
}

function View({ s, device, focus }: SceneViewProps<S>) {
  const phone = device === "phone";
  const replaced = s.outcome === "replaced";
  return (
    <div className="relative flex h-full flex-col bg-surface">
      <DemoHeader device={device} />
      <div data-demo-scroll="page" className={cn("min-h-0 flex-1", phone ? "overflow-y-auto p-4" : "flex gap-8 overflow-hidden px-8 py-7")}>
        {phone ? null : <AccountNav />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0 font-display text-step-5 font-[700] leading-none text-ink [font-stretch:112.5%]">Order {SAMPLE_ORDER.number}</p>
            <Plate variant={replaced ? "info" : s.sent ? "warning" : "success"} size="sm">
              {replaced ? "Replaced" : s.sent ? "Reported" : "Delivered"}
            </Plate>
          </div>
          {s.sent && !replaced ? (
            <div data-demo="status" className="th-pop mt-5 flex max-w-[760px] flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3 text-ui-md text-ink">
              <span className="flex items-center gap-2">
                <Lamp on={s.review < 0.5} />
                {copy.received}
              </span>
              <span className={cn("flex items-center gap-2", s.review < 0.5 && "text-ink-subtle")}>
                {s.review >= 0.5 ? <DialLoader label={copy.checking} /> : <Lamp on={false} />}
                {copy.checking}
              </span>
              <span className="text-ui-sm text-ink-muted">We reply {STORE_POLICY.support.replyTime}.</span>
            </div>
          ) : null}
          <div data-demo="outcome" className="mt-6 flex max-w-[760px] flex-col gap-4">
            {replaced ? (
              <KeyPlate keyId="sample-new" title={SAMPLE_ORDER.title} keyInfo={SAMPLE_ORDER.key} status="ready" demo demoValue={copy.newKey} demoState={{ masked: true, decrypt: 0, copied: false }} issuedAt="2026-10-07T09:12:00Z" className="th-rise" />
            ) : null}
            {replaced ? (
              <p className="m-0 border-y border-line py-3 font-mono text-data text-ink-muted">
                <s>{copy.oldKey}</s> · {copy.replaced}
              </p>
            ) : (
              <KeyPlate keyId="sample" title={SAMPLE_ORDER.title} keyInfo={SAMPLE_ORDER.key} status={s.sent ? "reported" : "ready"} demo demoValue={copy.oldKey} demoState={{ masked: false, decrypt: 1, copied: false }} issuedAt={SAMPLE_ORDER.issuedAt} />
            )}
          </div>
        </div>
      </div>
      {s.open ? <ReportDialog s={s} focus={focus} /> : null}
    </div>
  );
}

export const support = defineScene<S>({
  id: "support",
  title: meta.title,
  summary: meta.summary,
  url: copy.url,
  device: "desktop",
  initial: { open: false, list: false, reason: "", note: "", sent: false, review: 0, outcome: "none" },
  View,
  script: ({ caption, click, type, tween, set, highlight, wait }) => [
    caption(meta.captions[0]!),
    click("report", { open: true }),
    click("reason", { list: true }),
    click("reason-redeemed", { list: false, reason: copy.reasons[0] }),
    type("note", copy.note, { key: "note", ms: 22 }),
    click("send", { open: false, sent: true }),
    caption(fillCopy(meta.captions[1]!)),
    tween("review", 1, 1800, { ease: "linear" }),
    set({ outcome: "replaced" }),
    caption(meta.captions[2]!),
    highlight("outcome", copy.tipOutcome),
    wait(1200),
  ],
});
