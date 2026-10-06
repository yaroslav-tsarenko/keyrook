"use client";

import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Choice";
import { Input } from "@/components/ui/Field";
import { DialLoader, DialRuler } from "@/components/ui/Dial";
import { Plate } from "@/components/ui/Plate";
import { Lamp } from "@/components/ui/Lamp";
import { Cover } from "@/components/product/Cover";
import { LabelRow, productFace } from "@/components/product/ProductCard";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { Wordmark } from "@/components/layout/BrandMark";
import { STORE_POLICY } from "@/config/store-policy";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import { defineScene } from "../define";
import { SampleCover } from "../sample-cover";
import type { SceneViewProps } from "../types";
import { SAMPLE_ORDER } from "./data";
import { sceneMeta, THEATER_COPY } from "./meta";

type Step = "review" | "hosted" | "challenge" | "confirmed";
type S = { region: boolean; terms: boolean; consent: boolean; step: Step; card: string; exp: string; cvc: string; approving: number };

const copy = THEATER_COPY.scenes.pay;
const meta = sceneMeta("pay");
const face = productFace(SAMPLE_ORDER.title, SAMPLE_ORDER.key);

function CheckoutHeader({ phone }: { phone: boolean }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-between border-b border-line bg-rig", phone ? "h-14 px-4" : "h-16 px-6")}>
      <Wordmark className="h-[18px] w-auto text-ink" ticks={!phone} />
      <span className="inline-flex items-center gap-2 text-ui-sm font-[560] text-ink">
        <ShieldCheck size={18} aria-hidden="true" />
        Secure checkout
      </span>
    </div>
  );
}

function Review({ s, phone }: { s: S; phone: boolean }) {
  const { currency, convert } = useCurrency();
  const ready = s.region && s.terms && s.consent;
  const total = formatPrice(convert(SAMPLE_ORDER.total), currency);
  return (
    <div className={cn("h-full", phone ? "flex flex-col gap-4 overflow-hidden p-4" : "grid grid-cols-[minmax(0,1fr)_340px] gap-10 px-10 py-7")}>
      <div className="min-w-0">
        <DialRuler
          active={2}
          compactLabels={phone}
          doneIcon={<Check size={14} aria-hidden="true" className="text-ink" />}
          detents={[
            { key: "account", label: "Account" },
            { key: "details", label: "Details" },
            { key: "review", label: "Review & pay" },
          ]}
        />
        <p className="m-0 mt-6 font-display text-step-3 font-[600] text-ink [font-stretch:112.5%]">{copy.review}</p>
        <div className="mt-4 flex gap-4 border-y border-line py-3">
          <div className="w-[52px] shrink-0">
            <Cover alt="" compact art={<SampleCover title={face.title} compact />} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-ui-md font-[640] text-ink">{face.title}</p>
            <LabelRow face={face} edition className="mt-1" />
            <p className="m-0 mt-1 text-ui-sm text-ink-muted">Region: Global. {face.regionSentence}.</p>
          </div>
          <PriceDisplay price={SAMPLE_ORDER.total} size="sm" />
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <span data-demo="region">
            <Checkbox label={copy.regionCheck} checked={s.region} onChange={() => {}} />
          </span>
          <span data-demo="terms">
            <Checkbox label={copy.terms} checked={s.terms} onChange={() => {}} />
          </span>
          <span data-demo="consent">
            <Checkbox label={STORE_POLICY.waiver.text} checked={s.consent} onChange={() => {}} />
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button size="lg" isDisabled={!ready} data-demo="pay" className={phone ? "w-full" : ""}>
            {copy.payButton} {total}
          </Button>
          {phone ? null : <PaymentLogos height={20} />}
        </div>
      </div>
      {phone ? null : (
        <aside className="plate self-start p-5">
          <p className="eyebrow m-0">Summary</p>
          <dl className="m-0 mt-3 font-mono text-data">
            <div className="flex justify-between border-b border-line py-2">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="m-0 text-ink">{total}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink">Total</dt>
              <dd className="price m-0 text-step-2 text-ink">{total}</dd>
            </div>
          </dl>
          <p className="m-0 mt-3 text-ui-sm text-ink-muted">Keys are delivered to your account after your payment is confirmed.</p>
        </aside>
      )}
    </div>
  );
}

function Field({ demo, label, value, focused, mask }: { demo: string; label: string; value: string; focused: boolean; mask?: boolean }) {
  return (
    <span data-demo={demo} className="block">
      <Input label={label} value={mask ? "•".repeat(value.length) : value} onChange={() => {}} mono className={focused ? "border-ink" : ""} />
    </span>
  );
}

function Hosted({ s, focus, phone }: { s: S; focus: string | null; phone: boolean }) {
  const { currency, convert } = useCurrency();
  const total = formatPrice(convert(SAMPLE_ORDER.total), currency);
  return (
    <div className={cn("relative flex h-full items-start justify-center bg-surface-1", phone ? "p-4" : "p-10")}>
      <div className="th-pop w-full max-w-[440px] bg-raised p-6 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-ui-md font-[560] text-ink">
            <CreditCard size={18} aria-hidden="true" />
            {copy.hostedTitle}
          </span>
          <Plate variant="info" size="sm">
            Illustration
          </Plate>
        </div>
        <p className="m-0 mt-3 flex items-baseline justify-between border-y border-line py-3 text-ui-sm text-ink-muted">
          {copy.merchant}
          <span className="price text-step-1 text-ink">{total}</span>
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <Field demo="card" label={copy.cardNumber} value={s.card} focused={focus === "card"} />
          <div className="grid grid-cols-2 gap-3">
            <Field demo="exp" label={copy.expiry} value={s.exp} focused={focus === "exp"} />
            <Field demo="cvc" label={copy.cvc} value={s.cvc} focused={focus === "cvc"} mask />
          </div>
        </div>
        <span data-demo="submit" className="mt-5 flex h-12 w-full items-center justify-center bg-deal text-ui-md font-[640] text-on-deal">
          {copy.submit} {total}
        </span>
        <p className="m-0 mt-3 text-ui-xs text-ink-muted">{copy.hostedNote}</p>
      </div>
      {s.step === "challenge" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-scrim p-4">
          <div className="th-pop w-full max-w-[360px] bg-raised p-6 shadow-xl">
            <p className="m-0 flex items-center gap-2 text-ui-md font-[640] text-ink">
              <ShieldCheck size={18} aria-hidden="true" />
              {copy.bankTitle}
            </p>
            <p className="m-0 mt-1 text-ui-sm text-ink-muted">{copy.bankNote}</p>
            <div className="mt-5 flex min-h-12 items-center gap-3 border-t border-line pt-4 text-ui-md text-ink">
              {s.approving >= 1 ? (
                <>
                  <Check size={18} aria-hidden="true" className="text-success" />
                  {copy.bankApproved}
                </>
              ) : (
                <>
                  <DialLoader label={copy.bankWaiting} />
                  {copy.bankWaiting}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Confirmed({ phone }: { phone: boolean }) {
  return (
    <div className={cn("th-slide h-full", phone ? "flex flex-col gap-5 p-4" : "grid grid-cols-[minmax(0,1fr)_380px] gap-10 px-10 py-8")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="m-0 font-display text-step-5 font-[700] leading-none text-ink [font-stretch:112.5%]">{copy.confirmed}</p>
          <Plate variant="success" size="sm">
            Paid
          </Plate>
        </div>
        <p className="m-0 mt-3 font-mono text-data text-ink-muted">{copy.orderTitle}</p>
        <OrderTimeline status="paid" createdAt={SAMPLE_ORDER.createdAt} paidAt={SAMPLE_ORDER.paidAt} demo size="large" className="mt-8" />
      </div>
      <div data-demo="confirmation" className="plate self-start p-5">
        <p className="eyebrow m-0">{copy.received}</p>
        <ul className="m-0 mt-3 list-none p-0">
          {copy.receivedRows.map((r) => (
            <li key={r} className="flex items-center gap-3 border-b border-line py-2.5 text-ui-md text-ink">
              <Lamp on />
              {r}
            </li>
          ))}
          <li className="flex items-center gap-3 py-2.5 text-ui-md text-ink-muted">
            <Lamp on={false} />
            {copy.notReceived}
          </li>
        </ul>
      </div>
    </div>
  );
}

function View({ s, device, focus }: SceneViewProps<S>) {
  const phone = device === "phone";
  return (
    <div className="flex h-full flex-col bg-surface">
      {s.step === "hosted" || s.step === "challenge" ? null : <CheckoutHeader phone={phone} />}
      <div data-demo-scroll="page" className="min-h-0 flex-1 overflow-hidden">
        {s.step === "review" ? <Review s={s} phone={phone} /> : s.step === "confirmed" ? <Confirmed phone={phone} /> : <Hosted s={s} focus={focus} phone={phone} />}
      </div>
    </div>
  );
}

export const pay = defineScene<S>({
  id: "pay",
  title: meta.title,
  summary: meta.summary,
  url: (s) => (s.step === "hosted" || s.step === "challenge" ? { label: STORE_POLICY.payment.providerName ? `secure payment page · ${STORE_POLICY.payment.providerName}` : copy.hostedUrl, external: true } : s.step === "confirmed" ? copy.orderUrl : copy.url),
  device: "desktop",
  initial: { region: false, terms: false, consent: false, step: "review", card: "", exp: "", cvc: "", approving: 0 },
  View,
  script: ({ caption, click, wait, type, tween, set, highlight }) => [
    caption(meta.captions[0]!),
    click("region", { region: true }),
    click("terms", { terms: true }),
    click("consent", { consent: true }),
    click("pay", { step: "hosted" }),
    wait(700),
    caption(meta.captions[1]!),
    type("card", copy.card, { key: "card", ms: 40 }),
    type("exp", copy.exp, { key: "exp" }),
    type("cvc", copy.cvcValue, { key: "cvc" }),
    click("submit", { step: "challenge" }),
    caption(meta.captions[2]!),
    tween("approving", 1, 2000, { ease: "linear" }),
    wait(500),
    set({ step: "confirmed" }),
    caption(meta.captions[3]!),
    highlight("confirmation", copy.tipConfirmation),
    wait(1200),
  ],
});
