import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { buttonClasses } from "@/components/ui/button-classes";
import { Plate } from "@/components/ui/Plate";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { KeySlots } from "@/components/account/KeyPlate";
import { ActivationStepList, RedeemLink } from "@/components/product/ActivationSteps";
import { ACTIVATION, ACTIVATION_ORDER, COMMON_PROBLEMS } from "@/config/activation";
import { STORE_POLICY } from "@/config/store-policy";
import { platformInfo } from "@/lib/catalog/platforms";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "How activation works",
    description: "Your key is delivered to your account after payment is confirmed. You redeem it on the platform named on the product page. Steps for Steam, Epic, EA app, Ubisoft Connect, Xbox, PlayStation, Nintendo, GOG and Battle.net.",
    path: "/how-activation-works",
  });
}

const g = STORE_POLICY.guarantee;
const SAMPLE_KEY = "7XK2Q-0OQD9-H1LMP";

export default async function HowActivationWorksPage() {
  const stocked = await prisma.keyItem
    .groupBy({ by: ["platform"], where: { product: { status: "ACTIVE", quantity: { gt: 0 } } }, _count: { _all: true } })
    .then((rows) => new Set(rows.map((r) => r.platform)))
    .catch(() => new Set<string>());
  const platforms = ACTIVATION_ORDER.filter((key) => !["gog", "battle-net", "rockstar"].includes(key) || stocked.has(key)).map((key) => ({ guide: ACTIVATION[key], info: platformInfo(key) }));

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-container px-gutter">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How activation works" }]} />

        <section aria-labelledby="haw-title" data-anim="plate" className="pb-14 pt-6">
          <h1 id="haw-title" className="m-0 max-w-[18ch] text-step-6 leading-[0.98] tracking-[-0.015em] text-ink [font-weight:740]">
            How activation works
          </h1>
          <p className="m-0 mt-5 max-w-[60ch] text-step-1 leading-[1.5] text-ink-muted">Your key is delivered to your account after payment is confirmed. You redeem it on the platform named on the product page.</p>
          <nav aria-label="Jump to a platform" className="mt-8">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {platforms.map(({ guide, info }) => (
                <li key={guide.platform} data-platform={info.tone}>
                  <a href={`#${info.slug}`} className="plate inline-flex h-11 items-center gap-2 px-3.5 hover-device:hover:bg-raised">
                    <span aria-hidden="true" className="size-1.5 bg-platform" />
                    <span className="eyebrow text-ink">{info.short}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </div>

      <section aria-labelledby="payment-to-key" data-theater-slot="decrypt" className="border-y border-line bg-surface-1">
        <div className="mx-auto grid max-w-container gap-10 px-gutter py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-5">
            <h2 id="payment-to-key" data-anim="plate" className="m-0 text-step-4 leading-[1.06] text-ink">
              From payment to key
            </h2>
            <ol className="m-0 mt-6 flex list-none flex-col border-t border-rule p-0">
              {[
                "Payment confirmed: your key is issued to your account.",
                STORE_POLICY.security.keysEncryptedAtRest ? "It stays masked and encrypted until you choose Reveal." : "It stays masked until you choose Reveal.",
                "Copy it, or open the platform's own redeem page.",
              ].map((step, i) => (
                <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-line py-3">
                  <span aria-hidden="true" className="tumbler-slot mt-px text-[0.8125rem]">
                    {i + 1}
                  </span>
                  <span className="text-ui-md text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-4 text-ui-sm text-ink-muted">{STORE_POLICY.delivery.emailNote}</p>
          </div>
          <figure className="m-0 flex flex-col gap-6 lg:col-span-7" aria-label="Illustration with sample data: an order timeline and a revealed key">
            <OrderTimeline status="delivered" demo createdAt="2026-10-06T14:18:00Z" paidAt="2026-10-06T14:19:00Z" finishedAt="2026-10-06T14:21:00Z" revealedAt="2026-10-06T14:25:00Z" showRevealed />
            <div className="plate bolted steel-grain relative p-6 sm:p-7">
              <span data-bolt="tl" aria-hidden="true" />
              <span data-bolt="tr" aria-hidden="true" />
              <span data-bolt="bl" aria-hidden="true" />
              <span data-bolt="br" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 px-2">
                <span className="eyebrow">Key 1 of 1</span>
                <Plate variant="neutral" size="sm">
                  Sample data
                </Plate>
              </div>
              <p className="m-0 mt-3 px-2 text-step-1 font-[640] text-ink">Lantern Coast</p>
              <div className="mt-4 px-2">
                <KeySlots value={SAMPLE_KEY} masked={false} />
              </div>
              <p className="m-0 mt-4 px-2 font-mono text-[0.75rem] text-ink-muted">Sample key. The slashed zero and the letter O are drawn differently, so they can&apos;t be confused.</p>
            </div>
          </figure>
        </div>
      </section>

      <div className="mx-auto max-w-container px-gutter">
        {platforms.map(({ guide, info }) => (
          <section key={guide.platform} id={info.slug} aria-labelledby={`${info.slug}-title`} data-platform={info.tone} className="grid scroll-mt-28 gap-x-10 gap-y-6 border-b border-line py-14 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id={`${info.slug}-title`} className="m-0 flex items-center gap-3 text-step-4 leading-[1.06] text-ink">
                <span aria-hidden="true" className="size-2.5 bg-platform" />
                {guide.name}
              </h2>
              <p className="m-0 mt-4 text-ui-md text-ink">
                <span className="eyebrow mr-2">You need</span>
                {guide.need}
              </p>
              {guide.codeFormat ? <p className="m-0 mt-2 text-ui-md text-ink-muted">{guide.codeFormat}</p> : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <RedeemLink guide={guide} />
                <Link href={`/platform/${info.slug}`} className="text-ui-sm font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                  {info.short} keys
                </Link>
              </div>
            </div>
            <div className="measure lg:col-span-5">
              <ActivationStepList guide={guide} />
            </div>
            <div className="lg:col-span-3">
              <h3 className="eyebrow m-0 mb-2">Common problems</h3>
              <ul className="m-0 list-none border-t border-line p-0">
                {COMMON_PROBLEMS.map((p) => (
                  <li key={p.title} className="border-b border-line py-2.5 text-ui-sm text-ink">
                    {p.title}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <section aria-labelledby="not-working" className="grid gap-x-10 gap-y-6 py-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="not-working" data-anim="plate" className="m-0 text-step-4 leading-[1.06] text-ink">
              If a key doesn&apos;t work
            </h2>
            <p className="m-0 mt-3 text-ui-md text-ink-muted">
              {g.headline}. We reply {STORE_POLICY.support.replyTime}.
            </p>
          </div>
          <div className="measure lg:col-span-8">
            <dl className="m-0 border-t border-rule">
              {COMMON_PROBLEMS.map((p) => (
                <div key={p.title} className="border-b border-line py-4">
                  <dt className="text-ui-md font-[560] text-ink">{p.title}</dt>
                  <dd className="m-0 mt-1 text-ui-md text-ink-muted">{p.body}</dd>
                </div>
              ))}
              <div className="border-b border-line py-4">
                <dt className="text-ui-md font-[560] text-ink">How to report it</dt>
                <dd className="m-0 mt-1 text-ui-md text-ink-muted">
                  Open the key in Account → Keys and choose “Key not working? Report it”, within {g.claimDays} days of delivery. We check it within {g.reviewDays} business days and send a replacement key, or refund it if no replacement is available.
                </dd>
              </div>
            </dl>
            <Link href="/catalog" className={buttonClasses({ size: "lg", className: "mt-10" })}>
              Browse the catalogue
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
