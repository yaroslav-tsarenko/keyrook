"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { AccountPageHeader } from "@/components/account/AccountSidebar/AccountSidebar";
import { SteamDelivery, useSteamAccount } from "@/components/account/SteamDelivery/SteamDelivery";

export function SteamAccountView() {
  const t = useTranslations("account.steam");
  const params = useSearchParams();
  const flag = params.get("steam");
  const { steam, setSteam, loading, failed, reload } = useSteamAccount();

  return (
    <div className="flex flex-col gap-6 [&>div:first-child]:mb-2">
      <AccountPageHeader title={t("title")}>
        <p className="measure m-0 text-step-0 text-ink-muted">{t("lead")}</p>
      </AccountPageHeader>
      {flag === "linked" ? <Alert tone="success">{t("flags.linked")}</Alert> : null}
      {flag === "taken" ? <Alert tone="danger">{t("flags.taken")}</Alert> : null}
      {flag === "other" ? <Alert tone="danger">{t("flags.other")}</Alert> : null}
      <SteamDelivery nextPath="/account/steam" steam={steam} loading={loading} failed={failed} onSaved={setSteam} onRetry={reload} />
      <section aria-labelledby="where-trade-url" className="border-t border-line pt-6">
        <h2 id="where-trade-url" className="eyebrow m-0">
          Where to find it
        </h2>
        <ol className="m-0 mt-3 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-step-0 text-ink">
          {["Steam", "Inventory", "Trade Offers", "Who can send me Trade Offers?", "Trade URL"].map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 ? <ChevronRight size={14} aria-hidden="true" className="text-ink-subtle" /> : null}
              {step}
            </li>
          ))}
        </ol>
        <a
          href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-1 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
        >
          Open the page in Steam
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
