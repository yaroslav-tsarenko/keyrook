import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { FAQ_GROUPS as GROUPS, FAQ_VALUES as VALUES, faqLinkTags as linkTags, faqPlainTags as plainTags } from "@/components/faq/faq-content";
import { FaqIndex, OutlineLink } from "./FaqIndex";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq");
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription", VALUES), path: "/faq" });
}

export default async function FaqPage() {
  const t = await getTranslations("faq");

  const groups = GROUPS.map((group) => ({
    id: group.id,
    title: t(`groups.${group.id}.title`),
    items: group.items.map((key) => {
      const base = `groups.${group.id}.items.${key}`;
      return {
        key,
        q: t(`${base}.q`),
        a: t.rich(`${base}.a`, { ...VALUES, ...linkTags }),
        plain: t.markup(`${base}.a`, { ...VALUES, ...plainTags }),
      };
    }),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.plain },
      })),
    ),
  };

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("title") }]} />

      <header className="measure">
        <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{t("title")}</h1>
        <p className="mt-5 text-step-1 leading-[1.5] text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4">
          {t.rich("lead", { ...VALUES, ...linkTags })}
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <div>
          <div className="lg:sticky lg:top-[calc(var(--header-height-compact)+2rem)]">
            <FaqIndex label={t("groupsNav")} groups={groups.map((g) => ({ id: g.id, title: g.title }))} />
          </div>
        </div>

        <div className="min-w-0 max-w-[48rem]">
          {groups.map((group, index) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-title`}
              className={index === 0 ? "scroll-mt-32" : "mt-16 scroll-mt-32 lg:mt-20"}
            >
              <h2 id={`${group.id}-title`} className="m-0 mb-5 text-step-3 leading-[1.15] text-ink">
                {group.title}
              </h2>
              <Accordion>
                {group.items.map((item) => (
                  <AccordionItem key={item.key} id={`${group.id}-${item.key}`} title={item.q} headingLevel={3}>
                    <div className="measure text-step-0 leading-[1.7] text-ink-muted [&_a]:font-[560] [&_a]:text-ink [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4">
                      {item.a}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          <section aria-labelledby="faq-help" className="mt-20 border-t border-line pt-10 lg:mt-24">
            <h2 id="faq-help" className="m-0 text-step-3 leading-[1.15] text-ink">
              {t("stillNeedHelp")}
            </h2>
            <p className="measure mt-3 text-step-0 leading-[1.6] text-ink-muted">{t("stillNeedHelpBody", VALUES)}</p>
            <div className="mt-6">
              <OutlineLink href="/contact">{t("contactUs")}</OutlineLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
