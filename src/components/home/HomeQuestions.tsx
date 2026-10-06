import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { FAQ_VALUES, faqLinkTags } from "@/components/faq/faq-content";

const PICKS = [
  ["delivery", "how"],
  ["delivery", "region"],
  ["returns", "notWorking"],
  ["returns", "when"],
] as const;

export async function HomeQuestions() {
  const t = await getTranslations("faq");
  return (
    <section aria-labelledby="questions-title" data-section="questions" className="border-t border-line">
      <div className="mx-auto grid max-w-wide gap-x-6 gap-y-8 px-gutter pb-32 pt-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="questions-title" className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
            Questions
          </h2>
          <Link
            href="/faq"
            className="label-caps mt-6 inline-flex h-11 items-center rounded-control border border-control px-5 text-[1rem] text-ink transition-colors duration-[140ms] hover-device:hover:border-ink hover-device:hover:bg-raised"
          >
            All questions
          </Link>
        </div>
        <Accordion className="lg:col-span-8">
          {PICKS.map(([group, item]) => (
            <AccordionItem key={`${group}.${item}`} title={t(`groups.${group}.items.${item}.q`)} headingLevel={3}>
              <p className="m-0 max-w-[68ch] text-step-0 leading-[1.65] text-ink-muted [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
                {t.rich(`groups.${group}.items.${item}.a`, { ...FAQ_VALUES, ...faqLinkTags })}
              </p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
