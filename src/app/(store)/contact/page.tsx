import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CredentialsSheet } from "@/components/layout/Credentials/CredentialsSheet";
import { POLICY_FACTS as F } from "@/lib/policy-facts";
import { ContactForm } from "./ContactForm";
import { pageMetadata } from "@/lib/seo/metadata";

const VALUES = { brand: F.brand, company: F.company, replyTime: F.replyTime, supportHours: F.supportHours };

const linkTags = {
  delivery: (chunks: ReactNode) => <Link href="/policies/shipping">{chunks}</Link>,
  returns: (chunks: ReactNode) => <Link href="/policies/returns">{chunks}</Link>,
  faq: (chunks: ReactNode) => <Link href="/faq">{chunks}</Link>,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return pageMetadata({ title: t("title"), description: t("metaDescription", VALUES), path: "/contact" });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ order?: string | string[]; topic?: string | string[] }> }) {
  const t = await getTranslations("contact");
  const { order, topic } = await searchParams;
  const prefilledOrder = (Array.isArray(order) ? order[0] : order || "").slice(0, 40);
  const prefilledTopic = (Array.isArray(topic) ? topic[0] : topic || "").slice(0, 20);

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("title") }]} />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
        <div className="lg:col-span-5">
          <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{t("title")}</h1>
          <p className="measure mt-5 text-step-1 leading-[1.5] text-ink-muted">{t("promise", VALUES)}</p>

          <div className="mt-10">
            <CredentialsSheet stacked />
          </div>

          <div className="mt-10 border-t border-line pt-6 text-step-0 leading-[1.6] [&_a]:text-ink [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 hover-device:[&_a:hover]:decoration-2">
            <p className="m-0 font-semibold text-ink">{t("orderQuestions")}</p>
            <p className="mt-2 text-ink-muted">{t.rich("orderLinks", linkTags)}</p>
            <p className="mt-2 text-ink-muted">{t.rich("faqLink", linkTags)}</p>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm replyTime={F.replyTime} prefilledOrder={prefilledOrder} prefilledTopic={prefilledTopic} />
        </div>
      </div>
    </div>
  );
}
