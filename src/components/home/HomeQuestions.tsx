import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { buttonClasses } from "@/components/ui/button-classes";
import { FAQ_VALUES, faqLinkTags } from "@/components/faq/faq-content";
import { HomeHeading } from "./parts";

const ITEMS = [
  ["delivery", "time"],
  ["delivery", "region"],
  ["delivery", "redeem"],
  ["returns", "notWorking"],
  ["payment", "safe"],
  ["returns", "refund"],
] as const;

export async function HomeQuestions() {
  const t = await getTranslations("home.questions");
  const faq = await getTranslations("faq");
  return (
    <section id="questions" aria-labelledby="questions-title" data-home-section="questions" className="border-t border-line bg-surface pb-24 pt-16 lg:pb-28 lg:pt-20">
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-8 px-gutter lg:grid-cols-12">
        <div className="lg:col-span-4">
          <HomeHeading id="questions-title" title={t("title")} />
          <Link href="/faq" className={buttonClasses({ variant: "outline", className: "mt-6" })}>
            {t("all")}
          </Link>
          <p className="m-0 mt-5 text-ui-md text-ink-muted">
            {t.rich("contact", { link: (chunks: ReactNode) => <Link href="/contact" className="font-[560] text-ink underline decoration-1 underline-offset-4">{chunks}</Link> })}
          </p>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <Accordion>
            {ITEMS.map(([group, key]) => (
              <AccordionItem key={`${group}-${key}`} id={`home-${group}-${key}`} title={faq(`groups.${group}.items.${key}.q`)} headingLevel={3}>
                <div className="measure text-step-0 leading-[1.7] text-ink-muted [&_a]:font-[560] [&_a]:text-ink [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4">
                  {faq.rich(`groups.${group}.items.${key}.a`, { ...FAQ_VALUES, ...faqLinkTags })}
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
