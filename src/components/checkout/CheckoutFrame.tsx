"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/layout/BrandMark";
import { CurrencySelect } from "@/components/layout/Header/CurrencySelect";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { openCookieSettings } from "@/lib/consent";
import { POLICY_LINKS } from "./CheckoutCounter";

export function CheckoutHeader() {
  const t = useTranslations("checkout.frame");
  return (
    <header data-header="" data-header-state="checkout" data-print-hide="" className="shrink-0 border-b border-line bg-rig text-ink">
      <div className="mx-auto flex h-[var(--header-height-mobile)] max-w-narrow items-center justify-between gap-4 px-gutter lg:h-[var(--header-tier-1)]">
        <Link href="/" aria-label={t("home", { brand: BRAND.name })} className="flex shrink-0 items-center text-ink">
          <Wordmark className="h-[22px] w-auto lg:h-[27px]" />
        </Link>
        <p className="label-caps m-0 flex items-center gap-2 whitespace-nowrap text-[0.75rem] text-ink sm:text-[0.8125rem]">
          <ShieldCheck size={16} aria-hidden="true" className="shrink-0" />
          <span className="max-[389px]:sr-only">{t("secure")}</span>
        </p>
        <div className="flex items-center gap-2">
          <CurrencySelect className="max-sm:hidden" />
          <Link href="/cart" className="inline-flex min-h-11 items-center gap-1.5 text-ui-md font-[560] text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="max-sm:sr-only">{t("backToBag")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function CheckoutFooter() {
  const t = useTranslations("checkout.frame");
  const tp = useTranslations("checkout.policies");
  const year = new Date().getFullYear();
  return (
    <footer data-print-hide="" className="mt-auto border-t border-line">
      <div className="bg-floor text-ink">
        <div className="mx-auto flex max-w-narrow flex-col gap-5 px-gutter py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <nav aria-label={t("policiesLabel")}>
              <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                {POLICY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ui-sm text-ink underline-offset-4 hover-device:hover:underline">
                      {tp(link.key)}
                    </Link>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => openCookieSettings()} className="cursor-pointer text-ui-sm text-ink underline-offset-4 hover-device:hover:underline">
                    {t("cookieSettings")}
                  </button>
                </li>
              </ul>
            </nav>
            <p className="meta m-0 text-ink-muted">
              {t("credentials", { brand: BRAND.name, company: COMPANY.name, number: COMPANY.companyNumber, address: COMPANY.registeredOffice, email: COMPANY.email })}
            </p>
            <p className="meta m-0 text-ink-muted">{t("copyright", { year, brand: BRAND.name })}</p>
          </div>
          <PaymentLogos height={24} strip className="self-start md:self-center" />
        </div>
      </div>
    </footer>
  );
}
