"use client";

import type { ReactNode } from "react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils/cn";

export interface DetailRow {
  label: string;
  value: string;
}

export interface RequirementBlock {
  system: string;
  lines: string[];
}

export interface ProductDetailTabsProps {
  description: string[];
  redeemHeading: string;
  account: string;
  redeemSteps: string[];
  activationNotes: string[];
  regionNote: string;
  languageNote: string | null;
  requirements: RequirementBlock[] | null;
  details: DetailRow[];
  className?: string;
}

function Paragraphs({ blocks }: { blocks: string[] }) {
  return (
    <div className="measure flex flex-col gap-4 text-step-0 leading-[1.65] text-ink">
      {blocks.map((block, i) => (
        <p key={i} className="m-0 whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow m-0">{title}</h3>
      {children}
    </section>
  );
}

export function ProductDetailTabs({ description, redeemHeading, account, redeemSteps, activationNotes, regionNote, languageNote, requirements, details, className }: ProductDetailTabsProps) {
  const items: TabItem[] = [
    {
      id: "description",
      label: "Description",
      content: <Paragraphs blocks={description} />,
    },
    {
      id: "activation",
      label: "Activation",
      content: (
        <div className="grid gap-10 lg:grid-cols-2">
          <Section title={redeemHeading}>
            <p className="m-0 text-ui-md text-ink-muted">You need {account}.</p>
            <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-ui-md text-ink">
              {redeemSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Section>
          <div className="flex flex-col gap-8">
            <Section title="Region and language">
              <p className="m-0 text-ui-md text-ink">{regionNote}</p>
              {languageNote ? <p className="m-0 text-ui-md text-ink">{languageNote}</p> : null}
            </Section>
            {activationNotes.length ? (
              <Section title="Notes for this key">
                <Paragraphs blocks={activationNotes} />
              </Section>
            ) : null}
          </div>
        </div>
      ),
    },
  ];
  if (requirements?.length) {
    items.push({
      id: "requirements",
      label: "System requirements",
      content: (
        <div className={cn("grid gap-10", requirements.length > 1 && "lg:grid-cols-2")}>
          {requirements.map((block) => (
            <Section key={block.system} title={block.system}>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-ui-md text-ink">
                {block.lines.map((line) => (
                  <li key={line} className="border-b border-line pb-1.5">
                    {line}
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>
      ),
    });
  }
  if (details.length) {
    items.push({
      id: "details",
      label: "Details",
      content: (
        <dl className="m-0 grid max-w-[720px] grid-cols-[minmax(120px,200px)_minmax(0,1fr)] border-t border-line">
          {details.map((row) => (
            <div key={row.label} className="contents">
              <dt className="eyebrow border-b border-line py-3">{row.label}</dt>
              <dd className="m-0 border-b border-line py-3 text-ui-md text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  return (
    <section aria-label="Product details" className={className}>
      <Tabs items={items} label="Product details" />
    </section>
  );
}
