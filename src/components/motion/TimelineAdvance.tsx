"use client";

import { useLayoutEffect, useRef } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/hooks/useMediaQuery";
import { cssEase, MOTION_DURATION } from "@/lib/motion/tokens";

interface Snapshot {
  status: string;
  reached: number;
  jaw: { x: number; y: number } | null;
}

function reachedIndex(nodes: HTMLElement[]): number {
  let reached = -1;
  nodes.forEach((node, i) => {
    if (node.dataset.node && node.dataset.node !== "upcoming") reached = i;
  });
  return reached;
}

function jawOffset(root: HTMLElement): { x: number; y: number } | null {
  const jaw = root.querySelector<HTMLElement>("[data-timeline-jaw]");
  if (!jaw) return null;
  const a = jaw.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left, y: a.top - b.top };
}

export function TimelineAdvance({ status }: { status: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<Snapshot | null>(null);

  useLayoutEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-timeline]");
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"));
    const reached = reachedIndex(nodes);
    const jaw = jawOffset(root);
    const before = previous.current;
    previous.current = { status, reached, jaw };
    if (!before || before.status === status || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const timing = { duration: MOTION_DURATION.cartFlight, easing: cssEase("instrument"), fill: "backwards" as const };
    let step = 0;
    for (let i = Math.max(1, before.reached + 1); i <= reached; i++) {
      const seg = nodes[i]?.querySelector<HTMLElement>("[data-seg]");
      if (!seg) continue;
      const vertical = seg.offsetHeight > seg.offsetWidth;
      seg.style.transformOrigin = vertical ? "50% 0" : "0 50%";
      seg.animate([{ transform: vertical ? "scaleY(0)" : "scaleX(0)" }, { transform: "none" }], { ...timing, delay: step * MOTION_DURATION.ui });
      const dot = nodes[i]?.querySelector<HTMLElement>("[data-dot]");
      dot?.animate([{ opacity: 0.25, transform: "scale(0.6)" }, { opacity: 1, transform: "none" }], {
        ...timing,
        duration: MOTION_DURATION.ui,
        delay: step * MOTION_DURATION.ui + MOTION_DURATION.cartFlight * 0.6,
      });
      step += 1;
    }

    const moved = root.querySelector<HTMLElement>("[data-timeline-jaw]");
    if (moved && jaw && before.jaw) {
      const dx = before.jaw.x - jaw.x;
      const dy = before.jaw.y - jaw.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        moved.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: MOTION_DURATION.cartFlight + step * MOTION_DURATION.ui, easing: cssEase("instrument") });
      }
    }
  }, [status]);

  return <span ref={ref} hidden />;
}
