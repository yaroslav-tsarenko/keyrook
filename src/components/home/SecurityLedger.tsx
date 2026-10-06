import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Bolts } from "@/components/ui/Lamp";
import { MiniStill } from "@/components/theater/mini-still";
import { sceneEnabled } from "@/components/theater/scenes/meta";
import { STORE_POLICY } from "@/config/store-policy";
import { HomeHeading } from "./parts";
import { WireDiagram } from "./WireDiagram";

type Line = { key: string; text: string; href: string; show: boolean };

export async function SecurityLedger() {
  const t = await getTranslations("home.ledger");
  const p = STORE_POLICY;
  const hosted = p.payment.hostedPage;
  const columns: { key: string; head: string; lines: Line[] }[] = [
    {
      key: "kept",
      head: t("kept"),
      lines: [
        { key: "keys", text: p.security.keysEncryptedAtRest && !p.security.keyInEmail ? t("keptKeys") : t("keptKeysPlain"), href: "/policies/privacy#security", show: true },
        { key: "orders", text: t("keptOrders", { years: p.retention.orderRecordsYears }), href: "/policies/privacy#retention", show: p.invoices.pdf },
      ],
    },
    {
      key: "never",
      head: t("never"),
      lines: [
        { key: "card", text: t("neverCard"), href: "/policies/privacy#card-data", show: hosted },
        { key: "bank", text: t("neverBank"), href: "/policies/payment#security", show: p.payment.threeDSecure },
      ],
    },
    {
      key: "wrong",
      head: t("wrong"),
      lines: [
        { key: "key", text: t("wrongKey"), href: "/policies/returns#when-we-refund", show: p.guarantee.faultyKey },
        { key: "payment", text: t("wrongPayment"), href: "/policies/payment#when-charged", show: true },
        { key: "reply", text: t("wrongReply", { replyTime: p.support.replyTime }), href: "/contact", show: true },
      ],
    },
  ]
    .map((c) => ({ ...c, lines: c.lines.filter((l) => l.show) }))
    .filter((c) => c.lines.length > 0);
  const payStill = sceneEnabled("pay");
  const provider = p.payment.providerName ?? t("nodeProvider");
  const receives = [
    { key: "hosted", who: t("nodeHosted"), what: t("receivesHosted"), show: hosted },
    { key: "bank", who: t("nodeBank"), what: t("receivesBank"), show: p.payment.threeDSecure },
    { key: "provider", who: provider, what: t("receivesProvider"), show: hosted },
    { key: "keyrook", who: t("nodeKeyrook"), what: t("receivesKeyrook"), show: hosted },
    { key: "account", who: t("nodeAccount"), what: p.security.keysEncryptedAtRest && !p.security.keyInEmail ? t("receivesAccount") : t("receivesAccountPlain"), show: true },
  ].filter((r) => r.show);

  return (
    <section id="ledger" aria-labelledby="ledger-title" data-home-section="ledger" className="scroll-mt-24 bg-surface py-16 lg:py-28">
      <div className="mx-auto max-w-container px-gutter">
        <div data-depth="D2" className="plate bolted relative px-5 py-10 sm:px-8 lg:p-12">
          <Bolts />
          <div className="grid gap-x-10 gap-y-4 lg:grid-cols-12 lg:items-end">
            <HomeHeading id="ledger-title" eyebrow={t("eyebrow")} title={t("title")} className="lg:col-span-7" />
            <p className="m-0 max-w-[46ch] text-step-0 leading-[1.55] text-ink-muted lg:col-span-5">{t("lead")}</p>
          </div>
          <div className="mt-10 grid border-t border-rule lg:grid-cols-3">
            {columns.map((c, i) => (
              <div key={c.key} className={i > 0 ? "border-line max-lg:border-t lg:border-l lg:pl-8" : "lg:pr-8"}>
                <h3 className="eyebrow m-0 pb-3 pt-5 text-ink">{c.head}</h3>
                <ul className="m-0 list-none p-0">
                  {c.lines.map((l) => (
                    <li key={l.key} className="border-t border-line py-3.5">
                      <Link href={l.href} className="group/line flex items-start justify-between gap-4 text-ui-md leading-[1.5] text-ink">
                        <span className="decoration-1 underline-offset-4 group-hover/line:underline">{l.text}</span>
                        <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-subtle transition-colors duration-[120ms] group-hover/line:text-ink" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {hosted ? (
            <div className="mt-12 grid gap-10 border-t border-rule pt-8 lg:grid-cols-12">
              <div className={payStill ? "min-w-0 lg:col-span-8" : "min-w-0 lg:col-span-12"}>
                <h3 className="m-0 mb-6 text-step-2 leading-[1.15] text-ink">{t("diagramTitle")}</h3>
                <WireDiagram
                  labels={{ title: t("legend"), you: t("nodeYou"), hosted: t("nodeHosted"), bank: t("nodeBank"), bankSub: t("nodeBankSub"), provider: p.payment.providerName ?? t("nodeProvider"), keyrook: t("nodeKeyrook"), account: t("nodeAccount"), boundary: t("boundary") }}
                  legend={{ text: t("legend"), card: t("legendCard"), confirm: t("legendConfirm"), key: t("legendKey") }}
                />
                <h4 className="eyebrow m-0 mt-10 pb-3 text-ink">{t("receivesTitle")}</h4>
                <dl className="m-0 border-t border-rule">
                  {receives.map((r) => (
                    <div key={r.key} className="grid gap-x-6 gap-y-1 border-b border-line py-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                      <dt className="text-ui-sm font-[560] text-ink">{r.who}</dt>
                      <dd className="m-0 text-ui-sm leading-[1.5] text-ink-muted">{r.what}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {payStill ? (
                <figure className="m-0 min-w-0 lg:col-span-4">
                  <MiniStill scene="pay" state={{ step: "challenge", approving: 0.6, region: true, terms: true, consent: true, card: "4000 0000 0000 4821", exp: "09/29", cvc: "123" }} device="phone" className="th-mini-narrow" address="secure payment page" />
                  <figcaption className="mt-3 text-ui-sm text-ink-muted">{t("stillCaption")}</figcaption>
                </figure>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
