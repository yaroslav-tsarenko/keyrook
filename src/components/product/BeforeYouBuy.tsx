import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarSync, EarthLock, KeyRound, Languages, PackagePlus, ShieldAlert, Timer, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RequirementRow {
  key: string;
  label: string;
  icon: "platform" | "region" | "languages" | "requires" | "validity" | "card" | "age" | "delivery";
  value: ReactNode;
  note?: string | null;
}

const ICONS = {
  platform: KeyRound,
  region: EarthLock,
  languages: Languages,
  requires: PackagePlus,
  validity: CalendarSync,
  card: WalletCards,
  age: ShieldAlert,
  delivery: Timer,
};

export function BeforeYouBuy({ rows, className, headingId = "before-you-buy" }: { rows: RequirementRow[]; className?: string; headingId?: string }) {
  return (
    <section aria-labelledby={headingId} data-requirements="" className={className}>
      <h2 id={headingId} className="m-0 text-step-2 leading-[1.15] text-ink">
        Before you buy
      </h2>
      <dl className="m-0 mt-4 border-t border-rule">
        {rows.map((row) => {
          const Icon = ICONS[row.icon];
          return (
            <div key={row.key} className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 border-b border-line py-3.5 sm:grid-cols-[24px_128px_minmax(0,1fr)]">
              {row.icon === "age" ? <span /> : <Icon size={18} aria-hidden="true" className="mt-0.5 text-ink-muted" />}
              <dt className="eyebrow pt-[3px]">{row.label}</dt>
              <dd className="col-start-2 m-0 text-ui-md leading-[1.5] text-ink sm:col-start-3">
                {row.value}
                {row.note ? <span className="mt-1 block font-mono text-[0.75rem] uppercase tracking-[0.02em] text-ink-muted">{row.note}</span> : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export interface RequirementBlock {
  system: string;
  lines: string[];
}

function splitLine(line: string): [string | null, string] {
  const i = line.indexOf(":");
  if (i > 0 && i < 24) return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  return [null, line];
}

export function SystemRequirements({ blocks, className }: { blocks: RequirementBlock[]; className?: string }) {
  const structured = blocks.length === 2 && blocks.every((b) => /minimum|recommended/i.test(b.system));
  if (structured) {
    const [min, rec] = blocks;
    const keys = [...new Set([...min.lines, ...rec.lines].map((l) => splitLine(l)[0]).filter((k): k is string => Boolean(k)))];
    const valueOf = (b: RequirementBlock, k: string) => b.lines.map(splitLine).find(([key]) => key === k)?.[1] ?? "—";
    return (
      <table className={cn("w-full max-w-[860px] border-collapse text-left", className)}>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="eyebrow w-[140px] py-3 pr-4 font-semibold">
              <span className="sr-only">Component</span>
            </th>
            <th scope="col" className="eyebrow py-3 pr-4 font-semibold">
              {min.system}
            </th>
            <th scope="col" className="eyebrow py-3 font-semibold">
              {rec.system}
            </th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-b border-line align-top">
              <th scope="row" className="eyebrow py-3 pr-4 font-semibold">
                {k}
              </th>
              <td className="py-3 pr-4 text-ui-md text-ink">{valueOf(min, k)}</td>
              <td className="py-3 text-ui-md text-ink">{valueOf(rec, k)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <div className={cn("grid gap-10", blocks.length > 1 && "lg:grid-cols-2", className)}>
      {blocks.map((block) => (
        <section key={block.system} aria-label={`${block.system} requirements`}>
          <h3 className="eyebrow m-0 mb-2">{block.system}</h3>
          <dl className="m-0 border-t border-rule">
            {block.lines.map((line) => {
              const [k, v] = splitLine(line);
              return (
                <div key={line} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-line py-2.5">
                  <dt className="eyebrow pt-[3px]">{k ?? "Note"}</dt>
                  <dd className="m-0 text-ui-md text-ink">{v}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}

export function RequiresLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="font-[560] underline decoration-line-hover underline-offset-4 hover-device:hover:decoration-ink">
      {title}
    </Link>
  );
}
