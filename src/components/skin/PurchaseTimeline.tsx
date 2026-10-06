import type { ReactNode } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Jaw } from "./FloatRuler";
import { TimelineAdvance } from "@/components/motion/TimelineAdvance";

const HAPPY = ["Payment confirmed", "Processing", "Trade offer sent", "Delivered"] as const;

const STEP_OF: Record<string, number> = {
  awaiting_payment: -1,
  paid: 0,
  submitted: 1,
  processing: 1,
  sent: 2,
  finished: 3,
};

export const STATUS_COPY: Record<string, string> = {
  awaiting_payment: "Waiting for your payment to be confirmed.",
  paid: "Payment received. We're preparing your trade offer.",
  submitted: "We're preparing your trade offer.",
  processing: "We're preparing your trade offer.",
  sent: "Your trade offer is in Steam. Accept it before it expires.",
  finished: "Delivered to your Steam inventory.",
  failed: "Delivery didn't go through. Your refund is being processed.",
  rolled_back: "The trade was reversed in Steam. Your refund is being processed.",
  refund_pending: "Your refund is being processed.",
  refunded: "Refunded to your card.",
};

const BRANCH_LABEL: Record<string, string> = {
  failed: "Failed",
  rolled_back: "Rolled back",
  refund_pending: "Refund pending",
  refunded: "Refunded",
};

function stamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(d);
}

interface Node {
  label: string;
  state: "done" | "current" | "upcoming" | "danger" | "neutral";
  time: string | null;
}

export interface PurchaseTimelineProps {
  status: string;
  paidAt?: string | null;
  finishedAt?: string | null;
  refundedAt?: string | null;
  offerUrl?: string | null;
  expiresAt?: string | null;
  reachedBeforeBranch?: number;
  size?: "large" | "compact";
  className?: string;
}

export function PurchaseTimeline({ status, paidAt, finishedAt, refundedAt, offerUrl, expiresAt, reachedBeforeBranch, size = "compact", className }: PurchaseTimelineProps) {
  const branch = BRANCH_LABEL[status];
  const step = STEP_OF[status] ?? 0;
  let nodes: Node[];
  if (branch) {
    const reached = Math.max(0, reachedBeforeBranch ?? (status === "rolled_back" ? 3 : 1));
    nodes = [
      ...HAPPY.slice(0, reached).map((label, i) => ({ label, state: "done" as const, time: i === 0 ? stamp(paidAt) : null })),
      { label: branch, state: status === "refunded" ? ("neutral" as const) : ("danger" as const), time: status === "refunded" ? stamp(refundedAt) : null },
    ];
  } else {
    const head: Node[] = step < 0 ? [{ label: "Awaiting payment", state: "current", time: null }] : [];
    nodes = [
      ...head,
      ...HAPPY.map((label, i) => {
        const state: Node["state"] = step < 0 ? "upcoming" : i < step || (status === "finished" && i === step) ? "done" : i === step ? "current" : "upcoming";
        const time = i === 0 ? stamp(paidAt) : i === 3 ? stamp(finishedAt) : null;
        return { label, state, time: state === "upcoming" ? null : time };
      }),
    ];
  }
  const large = size === "large";
  const expiry = stamp(expiresAt);

  return (
    <div data-timeline="" data-status={status} className={cn("min-w-0", className)}>
      <TimelineAdvance status={status} />
      <ol className={cn("relative m-0 grid list-none p-0", large ? "max-sm:gap-6 sm:grid-flow-col sm:auto-cols-fr" : "max-sm:gap-4 sm:grid-flow-col sm:auto-cols-fr")}>
        {nodes.map((node, i) => (
          <li key={`${node.label}-${i}`} data-node={node.state} aria-current={node.state === "current" ? "step" : undefined} className="relative min-w-0 max-sm:pl-7 sm:pt-7">
            {i > 0 ? (
              <span aria-hidden="true" data-seg="" className={cn("absolute bg-rule max-sm:left-[4.5px] max-sm:-top-6 max-sm:h-[calc(100%)] max-sm:w-px sm:right-[calc(100%-5px)] sm:top-[4.5px] sm:h-px sm:w-full", large ? "max-sm:-top-6" : "max-sm:-top-4")} />
            ) : null}
            {node.state === "current" ? (
              <span aria-hidden="true" data-timeline-jaw="" className="absolute max-sm:-left-[1px] max-sm:-top-5 sm:-top-[20px] sm:left-[-1px]">
                <Jaw />
              </span>
            ) : null}
            <span
              aria-hidden="true"
              data-dot=""
              className={cn(
                "absolute left-0 top-0 z-[1] size-2.5 rounded-full border transition-colors duration-[200ms] max-sm:top-1.5",
                node.state === "done" && "border-ink bg-ink",
                node.state === "current" && "border-2 border-brand bg-surface",
                node.state === "upcoming" && "border-line-hover bg-surface",
                node.state === "danger" && "border-danger bg-danger",
                node.state === "neutral" && "border-ink-muted bg-ink-muted",
              )}
            />
            <p
              className={cn(
                "m-0 leading-[1.25]",
                large ? "text-step-0" : "text-ui-md",
                node.state === "upcoming" ? "text-ink-subtle" : "text-ink",
                node.state === "current" && "font-semibold",
                node.state === "danger" && "font-semibold text-danger",
              )}
            >
              {node.label}
            </p>
            {node.time ? <p className="m-0 mt-1 font-mono text-[0.75rem] text-ink-muted">{node.time}</p> : null}
          </li>
        ))}
      </ol>
      <p aria-live="polite" className={cn("m-0 mt-4 text-ink-muted", large ? "text-step-0" : "text-ui-md")}>
        {STATUS_COPY[status] ?? ""}
      </p>
      {status === "sent" && (offerUrl || expiry) ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {offerUrl ? (
            <a
              href={offerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label-caps inline-flex h-9 items-center gap-2 rounded-control bg-brand px-3.5 text-[0.875rem] text-on-brand [[data-theme=light]_&]:border [[data-theme=light]_&]:border-accent-edge hover-device:hover:bg-brand-hover"
            >
              Open trade offer
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ) : null}
          {expiry ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-data text-ink">
              <Clock size={14} aria-hidden="true" className="text-ink-muted" />
              Accept before {expiry}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface TimelineStep {
  title: string;
  body: ReactNode;
}

export function TimelineSteps({ steps, headingLevel = 3, className }: { steps: TimelineStep[]; headingLevel?: 3 | 2; className?: string }) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <ol data-timeline="static" className={cn("relative m-0 grid list-none gap-8 p-0 md:grid-flow-col md:auto-cols-fr md:gap-6", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="relative min-w-0 max-md:pl-8 md:pt-9">
          {i > 0 ? <span aria-hidden="true" className="absolute bg-rule max-md:-top-8 max-md:left-[4.5px] max-md:h-[calc(100%+2rem)] max-md:w-px md:right-[calc(100%-5px)] md:top-[4.5px] md:h-px md:w-[calc(100%+1.5rem)]" /> : null}
          <span aria-hidden="true" className="absolute left-0 top-0 z-[1] size-2.5 rounded-full border border-ink bg-surface max-md:top-2" />
          <Heading className="m-0 font-display text-step-2 font-semibold leading-[1.12] text-ink">{step.title}</Heading>
          <div className="mt-2 max-w-[34ch] text-ui-md leading-[1.55] text-ink-muted">{step.body}</div>
        </li>
      ))}
    </ol>
  );
}
