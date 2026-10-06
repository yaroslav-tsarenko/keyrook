import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { buttonClasses } from "@/components/ui/button-classes";
import { SplitWords } from "@/components/motion/SplitWords";
import { TimelineSteps } from "@/components/account/PurchaseTimeline";
import { STORE_POLICY } from "@/config/store-policy";
import { PLATFORMS, REGIONS } from "@/lib/keys/taxonomy";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "How delivery works",
    description: "You pay by card, your activation key is issued to your account after payment is confirmed, and you redeem it on the platform. Regions, languages, activation steps and what happens if a key does not work.",
    path: "/how-it-works",
  });
}

const d = STORE_POLICY.delivery;
const r = STORE_POLICY.returns;
const g = STORE_POLICY.guarantee;

const STEPS = [
  { title: "Check the product page", body: "It names the platform the key is redeemed on, the activation region and the languages. A region-locked key only works on an account set to that region." },
  { title: "Pay by card", body: "You pay on the payment provider's secure page. Before you pay we re-check each price and its stock; if a price has changed, you see it and decide." },
  { title: "Your key is issued", body: `Once your payment is confirmed we request the key. It appears ${d.where}, ${d.usualTime}. ${d.emailNote}` },
  { title: "Reveal and redeem", body: "Open the order, select Reveal key, copy it and enter it on the platform. The steps for each platform are below and on your order page." },
];

const BRANCHES = [
  { label: "The key is late", body: `Most keys are issued within minutes. If we cannot issue a key within ${d.deadlineHours} hours of payment confirmation, we refund it.` },
  { label: "The key does not activate", body: `Tell us within ${g.claimDays} days of delivery, with the order number and a screenshot of the error. We check it within ${g.reviewDays} business days and replace or refund it.` },
  { label: "Wrong region or platform", body: "If the key does not match its product page, we replace or refund it. If the product page stated the region correctly, we cannot take the key back once it has been issued." },
  { label: "When the refund arrives", body: `Refunds go back to ${r.refundMethod} within ${r.refundDays} days. Your bank may take a few more working days to show it.` },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How delivery works" }]} />

      <section aria-labelledby="hiw-title" className="grid items-end gap-10 pb-20 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 id="hiw-title" data-anim="words" className="m-0 text-step-6 font-[680] leading-[0.96] tracking-[-0.01em] text-ink">
            <SplitWords text="How delivery works" />
          </h1>
          <p className="m-0 mt-6 max-w-[56ch] text-step-1 leading-[1.5] text-ink-muted">You pay by card, the key is issued to your account once the payment is confirmed, and you redeem it on the platform.</p>
        </div>
      </section>

      <section aria-label="Delivery steps" className="border-t border-rule pt-12">
        <TimelineSteps steps={STEPS} headingLevel={2} />
      </section>

      <div className="mt-24 grid gap-x-10 gap-y-16 lg:grid-cols-12">
        <section aria-labelledby="regions-title" className="lg:col-span-5">
          <h2 id="regions-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
            Activation regions
          </h2>
          <dl className="m-0 mt-6 border-t border-line">
            {REGIONS.map((region) => (
              <div key={region.key} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                <dt className="eyebrow pt-1">{region.label}</dt>
                <dd className="m-0 text-step-0 text-ink">{region.note}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-4 text-ui-md text-ink-muted">Don&apos;t use a VPN to redeem a key outside its region. Platforms can block the key or your account.</p>
        </section>

        <section aria-labelledby="wrong-title" className="lg:col-span-6 lg:col-start-7">
          <h2 id="wrong-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
            If something goes wrong
          </h2>
          <dl className="m-0 mt-6 border-t border-line">
            {BRANCHES.map((b) => (
              <div key={b.label} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                <dt className="eyebrow pt-1">{b.label}</dt>
                <dd className="m-0 text-step-0 leading-[1.6] text-ink">{b.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section aria-labelledby="redeem-title" className="mt-24 border-t border-line pt-12">
        <h2 id="redeem-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
          Redeeming on each platform
        </h2>
        <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORMS.filter((p) => p.key !== "other").map((platform) => (
            <section key={platform.key} aria-labelledby={`redeem-${platform.key}`} className="border-t border-line pt-4">
              <h3 id={`redeem-${platform.key}`} className="m-0 font-display text-step-1 font-semibold text-ink">
                {platform.label}
              </h3>
              <p className="m-0 mt-1 text-ui-sm text-ink-muted">Needs {platform.account}.</p>
              <ol className="m-0 mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-ui-md text-ink">
                {platform.redeem.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <p className="measure m-0 mt-10 text-step-0 leading-[1.7] text-ink-muted">
          Some keys come with their own activation notes, shown on the product page and the order page. Read the full rules in our{" "}
          <Link href="/policies/shipping" className="font-semibold text-ink underline underline-offset-4">
            delivery policy
          </Link>{" "}
          and{" "}
          <Link href="/policies/warranty" className="font-semibold text-ink underline underline-offset-4">
            key guarantee
          </Link>
          .
        </p>
        <Link href="/catalog" className={buttonClasses({ size: "lg", className: "mt-10" })}>
          Browse the catalogue
        </Link>
      </section>
    </div>
  );
}
