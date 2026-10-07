"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils/cn";
import type { ActivationGuide } from "@/config/activation";
import { ActivationStepList, RedeemLink } from "./ActivationSteps";
import { SystemRequirements, type RequirementBlock } from "./BeforeYouBuy";

export interface DetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

export type { RequirementBlock };

export interface ProductDetailTabsProps {
  description: string[];
  guide: ActivationGuide | null;
  guideAnchor: string | null;
  account: string;
  fallbackSteps: string[];
  activationNotes: string[];
  requirements: RequirementBlock[] | null;
  details: DetailRow[];
  className?: string;
}

function About({ blocks }: { blocks: string[] }) {
  const [open, setOpen] = useState(false);
  const long = blocks.join(" ").length > 900;
  if (!blocks.length) return <p className="m-0 text-ink-muted">The publisher hasn’t supplied a description for this key.</p>;
  return (
    <div className="measure">
      <div className={cn("flex flex-col gap-4 text-step-0 leading-[1.65] text-ink", long && !open && "line-clamp-[12]")}>
        {blocks.map((block, i) => (
          <p key={i} className="m-0 whitespace-pre-line">
            {block}
          </p>
        ))}
      </div>
      {long ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="btn-text mt-4 min-h-10 cursor-pointer text-ui-md font-[560] text-ink">
          <span data-label="">{open ? "Show less" : "Read more"}</span>
        </button>
      ) : null}
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow m-0">{title}</h3>
      {children}
    </section>
  );
}

export function ProductDetailTabs({ description, guide, guideAnchor, account, fallbackSteps, activationNotes, requirements, details, className }: ProductDetailTabsProps) {
  const items: TabItem[] = [
    { id: "about", label: "About", content: <About blocks={description} /> },
    {
      id: "activation",
      label: "Activation",
      content: (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Block title={guide ? `Redeem on ${guide.name}` : "How to redeem"}>
              <p className="m-0 text-ui-md text-ink-muted">You need {guide?.need ?? account}.</p>
              {guide ? (
                <ActivationStepList guide={guide} />
              ) : (
                <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-ui-md text-ink">
                  {fallbackSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {guide?.codeFormat ? <p className="m-0 text-ui-sm text-ink-muted">{guide.codeFormat}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
                {guide ? <RedeemLink guide={guide} /> : null}
                {guideAnchor ? (
                  <Link href={`/how-activation-works#${guideAnchor}`} className="inline-flex min-h-10 items-center gap-1.5 text-ui-md font-[560] text-ink underline-offset-4 hover-device:hover:underline">
                    Full guide{guide ? ` for ${guide.name}` : ""}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </Block>
          </div>
          {activationNotes.length ? (
            <div className="lg:col-span-5">
              <Block title="Activation notes from the publisher">
                <div className="flex flex-col gap-3 border-l border-rule pl-4 text-ui-md leading-[1.6] text-ink">
                  {activationNotes.map((note, i) => (
                    <p key={i} className="m-0 whitespace-pre-line">
                      {note}
                    </p>
                  ))}
                </div>
              </Block>
            </div>
          ) : null}
        </div>
      ),
    },
  ];
  if (requirements?.length) {
    items.push({ id: "requirements", label: "System requirements", content: <SystemRequirements blocks={requirements} /> });
  }
  if (details.length) {
    items.push({
      id: "details",
      label: "Details",
      content: (
        <dl className="m-0 grid max-w-[860px] grid-cols-[minmax(120px,220px)_minmax(0,1fr)] border-t border-rule">
          {details.map((row) => (
            <div key={row.label} className="contents">
              <dt className="eyebrow border-b border-line py-3 pr-4">{row.label}</dt>
              <dd className={cn("m-0 border-b border-line py-3 text-ink", row.mono ? "font-mono text-data" : "text-ui-md")}>{row.value}</dd>
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
