import { cn } from "@/lib/utils/cn";
import { Lamp } from "@/components/ui/Lamp";
import { DialLoader, TickBand } from "@/components/ui/Dial";
import { TimelineAdvance } from "@/components/motion/TimelineAdvance";
import { STORE_POLICY } from "@/config/store-policy";

export const STATUS_COPY: Record<string, string> = {
  awaiting_payment: "Waiting for your payment to be confirmed.",
  payment_failed: "Your payment didn't go through. You haven't been charged.",
  paid: "Payment received. Your key is being issued.",
  submitted: "Payment received. Your key is being issued.",
  processing: "Payment received. Your key is being issued.",
  delayed: "Issuing is taking longer than usual. We'll email you as soon as your key is ready. You can also contact us with your order number.",
  delivered: "Your key is ready in your account.",
  failed: "Your refund is being processed.",
  refund_pending: "Your refund is being processed.",
  refunded: "Refunded to your card.",
  replaced: "We've issued a replacement key.",
};

const BRANCH: Record<string, { label: string; tone: "danger" | "neutral" }> = {
  payment_failed: { label: "Payment failed", tone: "danger" },
  failed: { label: "Refund pending", tone: "danger" },
  refund_pending: { label: "Refund pending", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
  delayed: { label: "Issuing delayed", tone: "danger" },
};

function stamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

type NodeState = "done" | "current" | "upcoming" | "danger" | "neutral";

interface Node {
  key: string;
  label: string;
  state: NodeState;
  time: string | null;
  issuing?: boolean;
}

export interface OrderTimelineProps {
  status: string;
  createdAt?: string | null;
  paidAt?: string | null;
  finishedAt?: string | null;
  refundedAt?: string | null;
  revealedAt?: string | null;
  showRevealed?: boolean;
  size?: "large" | "compact";
  className?: string;
  demo?: boolean;
}

export function timelineNodes({ status, createdAt, paidAt, finishedAt, refundedAt, revealedAt, showRevealed = false }: OrderTimelineProps): Node[] {
  const placed: Node = { key: "placed", label: "Order placed", state: "done", time: stamp(createdAt) };
  if (status === "payment_failed") return [placed, { key: "branch", label: BRANCH.payment_failed.label, state: "danger", time: null }];
  if (status === "awaiting_payment") {
    return [placed, { key: "paid", label: "Payment confirmed", state: "current", time: null }, { key: "issued", label: "Key issued", state: "upcoming", time: null }];
  }
  const paid: Node = { key: "paid", label: "Payment confirmed", state: "done", time: stamp(paidAt) };
  const branch = BRANCH[status];
  if (branch) return [placed, paid, { key: "branch", label: branch.label, state: branch.tone, time: status === "refunded" ? stamp(refundedAt) : null }];
  if (status === "delivered" || status === "replaced") {
    const nodes: Node[] = [placed, paid, { key: "issued", label: status === "replaced" ? "Replacement issued" : "Key issued", state: "done", time: stamp(finishedAt) }];
    if (showRevealed) nodes.push({ key: "revealed", label: "Revealed", state: revealedAt ? "done" : "upcoming", time: stamp(revealedAt) });
    return nodes;
  }
  return [placed, paid, { key: "issued", label: "Key issued", state: "current", time: null, issuing: true }];
}

export function OrderTimeline(props: OrderTimelineProps) {
  const { status, size = "compact", className, demo = false } = props;
  const nodes = timelineNodes(props);
  const large = size === "large";
  const last = nodes.length - 1;
  const reached = nodes.reduce((acc, n, i) => (n.state !== "upcoming" ? i : acc), 0);
  const copy = STATUS_COPY[status] ?? "";
  const issuing = nodes.some((n) => n.issuing);

  return (
    <div data-timeline="" data-status={status} data-demo={demo ? "timeline" : undefined} className={cn("min-w-0", className)}>
      {demo ? null : <TimelineAdvance status={status} />}
      <div className="relative">
        <div aria-hidden="true" className="absolute left-[5px] right-[5px] top-[4px] hidden h-3 sm:block">
          <TickBand className="absolute inset-x-0 top-0" major={false} tone="faint" />
        </div>
        <ol className="relative m-0 grid list-none p-0 max-sm:gap-5 sm:grid-flow-col" style={{ gridAutoColumns: "minmax(0, 1fr)" }}>
          {nodes.map((node, i) => (
            <li key={node.key} data-node={node.state} aria-current={node.state === "current" ? "step" : undefined} className={cn("relative min-w-0 max-sm:pl-7", i === last && nodes.length > 1 ? "sm:text-right" : i === 0 ? "" : "sm:text-center", "sm:pt-7")}>
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  data-seg=""
                  className={cn(
                    "absolute max-sm:left-[4.5px] max-sm:-top-5 max-sm:h-[calc(100%+1.25rem)] max-sm:w-px sm:top-[4.5px] sm:h-px",
                    i === last ? "sm:right-[5px] sm:w-[calc(100%-5px)]" : "sm:right-1/2 sm:w-full",
                    i <= reached ? "bg-ink" : "bg-line-hover",
                    node.state === "danger" && "bg-danger",
                  )}
                />
              ) : null}
              <span
                aria-hidden="true"
                data-dot=""
                className={cn(
                  "absolute z-[1] grid size-2.5 place-items-center max-sm:left-0 max-sm:top-1.5 sm:top-0",
                  i === 0 ? "sm:left-0" : i === last ? "sm:right-0" : "sm:left-1/2 sm:-translate-x-1/2",
                )}
              >
                {node.state === "current" ? (
                  node.issuing ? null : <Lamp on className="size-2.5" />
                ) : (
                  <span
                    className={cn(
                      "block size-2.5 rounded-round",
                      node.state === "done" && "bg-ink",
                      node.state === "upcoming" && "border border-line-hover bg-surface",
                      node.state === "danger" && "bg-danger",
                      node.state === "neutral" && "bg-ink-muted",
                    )}
                  />
                )}
              </span>
              {node.issuing ? (
                <span className={cn("absolute z-[2] max-sm:-left-[7px] max-sm:-top-0.5", i === last ? "sm:-right-[7px] sm:-top-[7px]" : "sm:-top-[7px] sm:left-1/2 sm:-translate-x-1/2")}>
                  <DialLoader label="Issuing your key" />
                </span>
              ) : null}
              <p className={cn("m-0 leading-[1.25]", large ? "text-step-0" : "text-ui-md", node.state === "upcoming" ? "text-ink-subtle" : "text-ink", node.state === "current" && "font-[600]", node.state === "danger" && "font-[600] text-danger")}>{node.label}</p>
              {node.time ? <p className="m-0 mt-1 font-mono text-[0.75rem] text-ink-muted">{node.time}</p> : null}
            </li>
          ))}
        </ol>
      </div>
      <p aria-live="polite" className={cn("m-0 mt-4 text-ink-muted", large ? "text-step-0" : "text-ui-md")}>
        {copy}
        {issuing ? ` Usually within minutes after payment is confirmed. We'll email you when it's ready.` : ""}
      </p>
      {status === "refund_pending" || status === "failed" ? <p className="m-0 mt-1 text-ui-sm text-ink-muted">Refunds go back to your card within {STORE_POLICY.returns.refundDays} days.</p> : null}
    </div>
  );
}

export { OrderTimeline as PurchaseTimeline };
