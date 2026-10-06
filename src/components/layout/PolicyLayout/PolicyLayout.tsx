import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Plate } from "@/components/ui/Plate";
import { Lamp } from "@/components/ui/Lamp";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { cn } from "@/lib/utils/cn";
import { POLICY_SLUGS, policyHref, type PolicySlug } from "./policies";
import { PolicyJump } from "./PolicyJump";
import { pageMetadata } from "@/lib/seo/metadata";

export interface PolicySection {
  id: string;
  title: string;
  body: ReactNode;
}

interface PolicyLayoutProps {
  slug?: PolicySlug;
  title?: string;
  lastUpdated?: string | null;
  intro?: ReactNode;
  sections?: PolicySection[];
  children?: ReactNode;
}

export const policyProse = cn(
  "text-step-0 leading-[1.7] text-ink",
  "[&_p]:mt-4 [&_p:first-child]:mt-0",
  "[&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5",
  "[&_li]:pl-1 [&_li::marker]:text-ink-subtle",
  "[&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 hover-device:[&_a:hover]:decoration-2",
  "[&_strong]:font-[640]",
  "[&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-step-1 [&_h3]:leading-[1.25] [&_h3]:text-ink",
);

export const policyTable = cn(
  "mt-5 w-full border-collapse text-left text-ui-sm",
  "[&_th]:border-b [&_th]:border-line [&_th]:px-0 [&_th]:pb-3 [&_th]:pr-4 [&_th]:align-bottom [&_th]:text-ink-muted [&_th]:eyebrow",
  "[&_td]:border-b [&_td]:border-line [&_td]:py-3.5 [&_td]:pr-4 [&_td]:align-top",
);

const sideLinkCls = "relative flex items-center gap-3 py-2 text-ui-md text-ink-muted transition-colors duration-[120ms] hover-device:hover:text-ink";

export function policyMetadata(slug: PolicySlug, description: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("policies");
    return pageMetadata({ title: t(`items.${slug}.title`), description, path: policyHref(slug), type: "article" });
  };
}

export async function PolicyLayout({ slug, title: titleProp, lastUpdated = POLICY_FACTS.lastUpdated, intro, sections, children }: PolicyLayoutProps) {
  const t = await getTranslations("policies");
  const title = titleProp ?? (slug ? t(`items.${slug}.title`) : "");
  const entries = POLICY_SLUGS.map((s) => ({ slug: s, href: policyHref(s), title: t(`items.${s}.title`) }));
  const hasToc = Boolean(sections && sections.length > 1);

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          ...(slug ? [{ label: t("indexTitle"), href: "/policies" }] : []),
          { label: title },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <aside data-print-hide="" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-height-compact)+2rem)] flex max-h-[calc(100vh-var(--header-height-compact)-4rem)] flex-col gap-10 overflow-y-auto pb-6 no-scrollbar">
            <nav aria-label={t("policiesNav")}>
              <p className="eyebrow m-0">{t("policiesNav")}</p>
              <ul className="m-0 mt-3 list-none p-0">
                {entries.map((entry) => {
                  const active = entry.slug === slug;
                  return (
                    <li key={entry.slug}>
                      <Link
                        href={entry.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(sideLinkCls, active && "font-[560] text-ink")}
                      >
                        <Lamp on={active} />
                        {entry.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {hasToc ? (
              <nav aria-label={t("onThisPage")}>
                <p className="eyebrow m-0">{t("onThisPage")}</p>
                <ol className="m-0 mt-3 flex list-none flex-col gap-0.5 p-0">
                  {sections!.map((section, index) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="flex gap-2 py-1.5 text-ui-sm leading-[1.45] text-ink-muted hover-device:hover:text-ink">
                        <span className="w-6 shrink-0 font-mono text-[0.75rem] leading-[1.9] text-ink-subtle">{index + 1}.</span>
                        <span>{section.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
          </div>
        </aside>

        <article className="min-w-0">
          {slug ? (
            <div data-print-hide="" className="mb-8 lg:hidden">
              <PolicyJump
                label={t("jumpTo")}
                value={policyHref(slug)}
                options={[...entries.map((e) => ({ value: e.href, label: e.title })), { value: "/policies", label: t("allPolicies") }]}
              />
            </div>
          ) : null}

          <header className="measure">
            <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{title}</h1>
            {lastUpdated ? (
              <div className="mt-5">
                <Plate variant="neutral">
                  <time dateTime={lastUpdated === POLICY_FACTS.lastUpdated ? POLICY_FACTS.lastUpdatedIso : undefined}>{t("lastUpdated", { date: lastUpdated })}</time>
                </Plate>
              </div>
            ) : null}
            {intro ? <div className={cn(policyProse, "mt-8 text-step-1 leading-[1.55] text-ink-muted")}>{intro}</div> : null}
          </header>

          {hasToc ? (
            <div data-print-hide="" className="measure mt-8 lg:hidden">
              <Accordion>
                <AccordionItem title={t("onThisPage")} headingLevel={2} titleClassName="text-step-0">
                  <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    {sections!.map((section, index) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="flex min-h-11 items-center gap-2 text-ui-sm text-ink">
                          <span className="tabular w-6 shrink-0 text-ink-subtle">{index + 1}.</span>
                          <span>{section.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </AccordionItem>
              </Accordion>
            </div>
          ) : null}

          {sections ? (
            <div className="measure">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="mt-12 scroll-mt-32 border-t border-line pt-8 first:mt-12">
                  <h2 id={`${section.id}-title`} className="m-0 flex items-baseline gap-3 text-step-3 leading-[1.15] text-ink">
                    <span className="shrink-0 font-mono text-step-0 font-medium text-ink-subtle [font-stretch:100%]">{String(index + 1).padStart(2, "0")}</span>
                    <span>{section.title}</span>
                  </h2>
                  <div className={cn(policyProse, "mt-5")}>{section.body}</div>
                </section>
              ))}
            </div>
          ) : null}

          {children ? <div className={cn(policyProse, "measure mt-10")}>{children}</div> : null}
        </article>
      </div>
    </div>
  );
}

export function SellerBlock() {
  return (
    <dl className="m-0 mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border-y border-line py-5 text-ui-sm sm:grid-cols-[auto_minmax(0,1fr)]">
      <dt className="text-ink-muted">Merchant</dt>
      <dd className="m-0 font-medium text-ink">{COMPANY.name}, trading as {BRAND.name}</dd>
      <dt className="text-ink-muted">Company number</dt>
      <dd className="m-0 text-ink">{COMPANY.companyNumber}</dd>
      <dt className="text-ink-muted">Registered office</dt>
      <dd className="m-0 text-ink">{COMPANY.registeredOffice}</dd>
      <dt className="text-ink-muted">Email</dt>
      <dd className="m-0 text-ink">
        <a href={`mailto:${COMPANY.email}`} className="break-all">{COMPANY.email}</a>
      </dd>
      {COMPANY.phone ? (
        <>
          <dt className="text-ink-muted">Phone</dt>
          <dd className="m-0 text-ink">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>
          </dd>
        </>
      ) : null}
      <dt className="text-ink-muted">Support hours</dt>
      <dd className="m-0 text-ink">{COMPANY.supportHours}</dd>
    </dl>
  );
}
