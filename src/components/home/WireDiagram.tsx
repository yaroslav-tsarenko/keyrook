"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface WireLabels {
  title: string;
  you: string;
  hosted: string;
  bank: string;
  bankSub: string;
  provider: string;
  keyrook: string;
  account: string;
  boundary: string;
}

type Orientation = "row" | "column";

const CYCLE = 6;

function Packet({ kind, from, to, start, end, orientation, rest }: { kind: "card" | "confirm" | "key"; from: number; to: number; start: number; end: number; orientation: Orientation; rest?: number }) {
  const size = 9;
  const shape =
    kind === "card" ? (
      <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="var(--color-bg)" stroke="var(--color-text)" strokeWidth="1.5" />
    ) : kind === "confirm" ? (
      <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="var(--color-text)" />
    ) : (
      <g>
        <rect x={-6} y={-6} width={12} height={12} fill="var(--color-text)" />
        <circle cx={-1.5} cy={0} r={2} fill="var(--color-bg)" />
        <rect x={0} y={-0.75} width={4} height={1.5} fill="var(--color-bg)" />
      </g>
    );
  const pos = (v: number) => (orientation === "row" ? `${v},0` : `0,${v}`);
  if (rest !== undefined) {
    const v = from + (to - from) * rest;
    return <g transform={`translate(${pos(v)})`}>{shape}</g>;
  }
  const a = start / CYCLE;
  const b = end / CYCLE;
  return (
    <g opacity="0">
      {shape}
      <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" path={`M${pos(from)} L${pos(to)}`} keyPoints="0;0;1;1" keyTimes={`0;${a.toFixed(3)};${b.toFixed(3)};1`} calcMode="linear" />
      <animate attributeName="opacity" dur={`${CYCLE}s`} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={`0;${Math.max(0, a - 0.001).toFixed(3)};${a.toFixed(3)};${b.toFixed(3)};${Math.min(1, b + 0.03).toFixed(3)};1`} />
    </g>
  );
}

function Diagram({ labels, orientation }: { labels: WireLabels; orientation: Orientation }) {
  const row = orientation === "row";
  const nodes = [
    { key: "you", label: labels.you },
    { key: "hosted", label: labels.hosted },
    { key: "bank", label: labels.bank, sub: labels.bankSub },
    { key: "provider", label: labels.provider },
    { key: "keyrook", label: labels.keyrook, own: true },
    { key: "account", label: labels.account, own: true },
  ];
  const length = row ? 720 : 470;
  const start = row ? 60 : 30;
  const step = length / (nodes.length - 1);
  const at = (i: number) => start + i * step;
  const axis = row ? 92 : 36;
  const boundary = (at(3) + at(4)) / 2;
  const width = row ? 840 : 300;
  const height = row ? 176 : 540;
  const packets = (
    rest: boolean,
  ): { kind: "card" | "confirm" | "key"; from: number; to: number; start: number; end: number; rest?: number }[] => [
    { kind: "card", from: at(0), to: at(3), start: 0, end: 2.4, rest: rest ? 0.18 : undefined },
    { kind: "card", from: at(0), to: at(3), start: 0.5, end: 2.9, rest: rest ? 0.5 : undefined },
    { kind: "card", from: at(0), to: at(3), start: 1, end: 3.4, rest: rest ? 0.84 : undefined },
    { kind: "confirm", from: at(3), to: at(4), start: 3.5, end: 4.4, rest: rest ? 0.5 : undefined },
    { kind: "key", from: at(4), to: at(5), start: 4.5, end: 5.4, rest: rest ? 0.5 : undefined },
  ];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("block h-auto w-full", row ? "" : "mx-auto max-w-[320px]")} role="img" aria-label={labels.title}>
      <g transform={row ? `translate(0 ${axis})` : `translate(${axis} 0)`}>
        {row ? (
          <line x1={at(0)} y1="0" x2={at(5)} y2="0" stroke="var(--color-rule)" strokeWidth="1.5" />
        ) : (
          <line x1="0" y1={at(0)} x2="0" y2={at(5)} stroke="var(--color-rule)" strokeWidth="1.5" />
        )}
        {row ? (
          <line x1={boundary} y1="-70" x2={boundary} y2="62" stroke="var(--color-text-secondary)" strokeWidth="1" strokeDasharray="4 4" />
        ) : (
          <line x1="-30" y1={boundary} x2="260" y2={boundary} stroke="var(--color-text-secondary)" strokeWidth="1" strokeDasharray="4 4" />
        )}
        <text
          x={row ? boundary + 8 : 6}
          y={row ? -58 : boundary - 8}
          fill="var(--color-text)"
          style={{ fontFamily: "var(--font-display)", fontStretch: "125%", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em" }}
        >
          {labels.boundary.toUpperCase()}
        </text>
        {nodes.map((n, i) => {
          const p = at(i);
          const x = row ? p : 0;
          const y = row ? 0 : p;
          return (
            <g key={n.key}>
              <rect x={x - 8} y={y - 8} width="16" height="16" fill={n.own ? "var(--color-plate)" : "var(--color-raised)"} stroke="var(--color-border-control)" strokeWidth="1.2" />
              {n.own ? <rect x={x - 3} y={y - 3} width="6" height="6" fill="var(--color-text)" /> : null}
              <text
                x={row ? x : 24}
                y={row ? 34 : y + 4}
                textAnchor={row ? "middle" : "start"}
                fill="var(--color-text)"
                style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 560 }}
              >
                {n.label}
              </text>
              {n.sub ? (
                <text x={row ? x : 24} y={row ? 52 : y + 22} textAnchor={row ? "middle" : "start"} fill="var(--color-text-secondary)" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                  {n.sub}
                </text>
              ) : null}
            </g>
          );
        })}
        <g data-packets="live" className="wire-live">
          {packets(false).map((p, i) => (
            <g key={i} transform={row ? "translate(0 -22)" : "translate(-22 0)"}>
              <Packet {...p} orientation={orientation} />
            </g>
          ))}
        </g>
        <g data-packets="rest" className="wire-rest">
          {packets(true).map((p, i) => (
            <g key={i} transform={row ? "translate(0 -22)" : "translate(-22 0)"}>
              <Packet {...p} orientation={orientation} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export function WireDiagram({ labels, legend, className }: { labels: WireLabels; legend: { text: string; card: string; confirm: string; key: string }; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const svgs = Array.from(el.querySelectorAll("svg"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const apply = () => {
      for (const svg of svgs) {
        if (visible && !reduced.matches) svg.unpauseAnimations();
        else svg.pauseAnimations();
      }
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      apply();
    });
    io.observe(el);
    reduced.addEventListener("change", apply);
    apply();
    return () => {
      io.disconnect();
      reduced.removeEventListener("change", apply);
    };
  }, []);

  return (
    <figure ref={ref} data-scene="ledger" className={cn("m-0", className)}>
      <div className="max-md:hidden">
        <Diagram labels={labels} orientation="row" />
      </div>
      <div className="md:hidden">
        <Diagram labels={labels} orientation="column" />
      </div>
      <figcaption className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
        <span className="text-ui-sm leading-[1.5] text-ink-muted">{legend.text}</span>
        <span aria-hidden="true" className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-data-sm text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 border-[1.5px] border-ink" />
            {legend.card}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 bg-ink" />
            {legend.confirm}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative size-3 bg-ink">
              <span className="absolute left-[3px] top-[5px] h-0.5 w-1.5 bg-surface" />
            </span>
            {legend.key}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
