"use client";

import { DepositBox, LabelRow, productFace } from "@/components/product/ProductCard";
import { BuyBox } from "@/components/product/BuyBox";
import { EditionSelector } from "@/components/product/EditionSelector";
import { BeforeYouBuy } from "@/components/product/BeforeYouBuy";
import { Cover } from "@/components/product/Cover";
import { cn } from "@/lib/utils/cn";
import { platformInfo } from "@/lib/catalog/platforms";
import { defineScene } from "../define";
import { SampleCover } from "../sample-cover";
import type { SceneViewProps } from "../types";
import { SAMPLE_DELUXE, SAMPLE_PRODUCT, SAMPLE_REQUIREMENTS, SAMPLE_RESULTS, sampleEditions } from "./data";
import { DemoHeader, DemoPage, DemoScreen } from "./kit";
import { sceneMeta, THEATER_COPY } from "./meta";

type S = { q: string; results: boolean; open: boolean; edition: string; added: boolean; cart: number; cartRoll: number };

const copy = THEATER_COPY.scenes.pick;
const meta = sceneMeta("pick");

function Results({ phone }: { phone: boolean }) {
  return (
    <div className={cn(phone ? "p-4" : "px-6 py-5")}>
      <p className="m-0 mb-4 font-mono text-data text-ink-muted">
        “{copy.query}” · {copy.results}
      </p>
      <div className={cn("grid", phone ? "grid-cols-2 gap-2.5" : "grid-cols-6 gap-4")}>
        {SAMPLE_RESULTS.map((p, i) => (
          <div key={p.id} className="th-rise" style={{ ["--i" as string]: i }}>
            <DepositBox product={p} demo demoId={`card-${i + 1}`} demoCover={<SampleCover title={productFace(p.name, p.key).title} />} headingLevel={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Browse({ phone }: { phone: boolean }) {
  const platforms = (copy.browsePlatforms as readonly string[]).map((k) => platformInfo(k));
  return (
    <div className={cn(phone ? "p-4" : "px-6 py-6")}>
      <p className="eyebrow m-0 mb-3">{copy.browse}</p>
      <div className={cn("grid", phone ? "grid-cols-2 gap-2" : "grid-cols-6 gap-3")}>
        {platforms.map((p) => (
          <span key={p.slug} data-platform={p.tone} className="flex h-24 flex-col justify-between border border-line bg-plate p-3 shadow-machined">
            <span aria-hidden="true" className="size-1.5 bg-platform" />
            <span className="label-caps text-[0.8125rem] leading-[1.1] text-ink">{p.short}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Product({ s, phone }: { s: S; phone: boolean }) {
  const current = s.edition === "deluxe" ? SAMPLE_DELUXE : SAMPLE_PRODUCT;
  const face = productFace(current.name, current.key);
  return (
    <div className={cn("th-slide", phone ? "flex flex-col gap-5 p-4" : "grid grid-cols-[250px_minmax(0,1fr)_360px] gap-7 px-6 py-6")}>
      <div className={cn("plate p-2", phone && "w-[44%]")}>
        <Cover alt="" art={<SampleCover title={face.title} />} />
      </div>
      <div className="min-w-0">
        <LabelRow face={face} size="md" edition />
        <p className="m-0 mt-3 font-display text-step-4 font-[700] leading-[1.04] text-ink [font-stretch:112.5%]">{face.title}</p>
        <p className="m-0 mt-2 text-ui-sm text-ink-muted">Harbourlight Studio · Fen Road Publishing · 2025</p>
        <EditionSelector options={sampleEditions(s.edition === "deluxe" ? "deluxe" : "standard")} demo className="mt-5" />
        <div data-demo="requirements" className="mt-5">
          <BeforeYouBuy rows={SAMPLE_REQUIREMENTS} headingId="demo-before-you-buy" />
        </div>
      </div>
      <BuyBox product={current} demo demoInCart={s.added} className="self-start" />
    </div>
  );
}

function View({ s, device, focus }: SceneViewProps<S>) {
  const phone = device === "phone";
  return (
    <DemoScreen>
      <DemoHeader device={device} query={s.q} placeholder={copy.searchPlaceholder} focused={focus === "search"} cart={s.cart} />
      <DemoPage scroll="page" className={phone ? "overflow-y-auto" : ""}>
        {s.open ? <Product s={s} phone={phone} /> : s.results ? <Results phone={phone} /> : <Browse phone={phone} />}
      </DemoPage>
    </DemoScreen>
  );
}

export const pick = defineScene<S>({
  id: "pick",
  title: meta.title,
  summary: meta.summary,
  url: (s) => (s.open ? copy.pdpUrl : copy.url),
  device: "desktop",
  initial: { q: "", results: false, open: false, edition: "standard", added: false, cart: 0, cartRoll: 0 },
  end: { cartRoll: 1 },
  View,
  script: ({ caption, wait, type, set, highlight, click, tween }) => [
    caption(meta.captions[0]!),
    wait(400),
    type("search", copy.query, { key: "q" }),
    set({ results: true }),
    wait(500),
    caption(meta.captions[1]!),
    highlight("card-1-label", copy.tipLabel),
    click("card-1", { open: true }),
    caption(meta.captions[2]!),
    click("edition-deluxe", { edition: "deluxe" }),
    wait(400),
    highlight("requirements", copy.tipRequirements),
    caption(meta.captions[3]!),
    click("add", { added: true, cart: 1 }),
    tween("cartRoll", 1, 320),
    wait(1200),
  ],
});
