import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { buttonClasses } from "@/components/ui/button-classes";
import { CalibratedRuler } from "@/components/skin/FloatRuler";
import { SplitWords } from "@/components/motion/SplitWords";
import { TimelineSteps } from "@/components/skin/PurchaseTimeline";
import { STORE_POLICY } from "@/config/store-policy";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "How delivery works",
    description: "You pay by card, we send the CS2 skin to your Steam account as a trade offer, and you accept it in Steam. What your account needs and what happens if something goes wrong.",
    path: "/how-it-works",
  });
}

const d = STORE_POLICY.delivery;
const r = STORE_POLICY.returns;

const STEPS = [
  { title: "Sign in through Steam", body: "You sign in on Steam's own page. We receive your Steam ID and public profile name, which tells us which account the skin goes to. We never see your Steam password or Steam Guard codes." },
  { title: "Add your trade URL", body: "Your trade URL lets us send you a trade offer without being on your friends list. We check that it belongs to the Steam account you linked, and keep it for your next order." },
  { title: "Pay by card", body: "You pay on the payment provider's secure page. Before you pay we re-confirm each price; if one has changed, you see the new price and decide." },
  { title: "We send a trade offer", body: `Once your payment is confirmed we send the skin as a ${d.method}, ${d.usualTime}. If we can't deliver within ${d.deadlineHours} hours, we refund the item.` },
  { title: "Accept it in Steam", body: `Open Steam, go to Inventory, then Trade Offers, and accept the offer. It only gives you the item you bought and never asks for anything from your inventory. ${d.offerExpiryNote}` },
];

const BRANCHES = [
  { label: "The offer expired", body: "Contact us with your order ID. Where possible we send the offer again; otherwise we refund the item." },
  { label: "Delivery failed", body: "If the offer can't be completed, for example because the trade URL changed or the inventory is private, we refund the item and tell you what to change." },
  { label: "Steam reversed the trade", body: `If Steam reverses the trade while the item is under trade protection, we refund the full price you paid for that item.` },
  { label: "When the refund arrives", body: `Refunds go back to ${r.refundMethod} within ${r.refundDays} days. Your bank may take a few more working days to show it.` },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How delivery works" }]} />

      <section aria-labelledby="hiw-title" data-scene="calibration" className="grid items-end gap-10 pb-20 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 id="hiw-title" data-anim="words" className="m-0 text-step-6 font-[680] leading-[0.96] tracking-[-0.01em] text-ink">
            <SplitWords text="How delivery works" />
          </h1>
          <p className="m-0 mt-6 max-w-[52ch] text-step-1 leading-[1.5] text-ink-muted">You pay by card, we send the skin to your Steam account as a trade offer, you accept it in Steam.</p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <CalibratedRuler lit={["FT"]} draw decorative />
        </div>
      </section>

      <section aria-label="Delivery steps" className="border-t border-rule pt-12">
        <TimelineSteps steps={STEPS} headingLevel={2} />
      </section>

      <div className="mt-24 grid gap-x-10 gap-y-16 lg:grid-cols-12">
        <section aria-labelledby="needs-title" className="lg:col-span-5">
          <h2 id="needs-title" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
            What your Steam account needs
          </h2>
          <ul className="m-0 mt-6 list-none border-t border-line p-0">
            {d.requirements.map((req) => (
              <li key={req} className="border-b border-line py-3 text-step-0 text-ink first-letter:uppercase">
                {req}
              </li>
            ))}
          </ul>
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

      <section aria-labelledby="steam-rules" className="mt-24 border-t border-line pt-12">
        <h2 id="steam-rules" className="m-0 text-step-3 font-semibold leading-[1.1] text-ink">
          Steam&apos;s own rules
        </h2>
        <p className="measure m-0 mt-4 text-step-0 leading-[1.7] text-ink-muted">
          Steam may keep items you receive in a trade under trade protection for up to {d.tradeProtectionDays} days, during which they can&apos;t be traded or sold. Accounts without the Steam Guard Mobile Authenticator can see trade holds of up to {d.tradeHoldMaxDays} days. These are Valve&apos;s rules and apply to every trade, whoever it&apos;s with. Read more in our{" "}
          <Link href="/policies/shipping" className="font-semibold text-ink underline underline-offset-4">
            delivery policy
          </Link>
          .
        </p>
        <Link href="/catalog" className={buttonClasses({ size: "lg", className: "mt-10" })}>
          Browse all skins
        </Link>
      </section>
    </div>
  );
}
