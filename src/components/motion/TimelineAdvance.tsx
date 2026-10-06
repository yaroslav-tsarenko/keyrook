"use client";

import { useLayoutEffect, useRef } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/hooks/useMediaQuery";
import { cssEase, MOTION_DURATION } from "@/lib/motion/tokens";

interface Snapshot {
  status: string;
  reached: number;
}

function reachedIndex(nodes: HTMLElement[]): number {
  let reached = -1;
  nodes.forEach((node, i) => {
    if (node.dataset.node && node.dataset.node !== "upcoming") reached = i;
  });
  return reached;
}

export function TimelineAdvance({ status }: { status: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<Snapshot | null>(null);

  useLayoutEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-timeline]");
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"));
    const reached = reachedIndex(nodes);
    const before = previous.current;
    previous.current = { status, reached };
    if (!before || before.status === status || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const timing = { duration: 420, easing: cssEase("latch"), fill: "backwards" as const };
    let step = 0;
    for (let i = Math.max(1, before.reached + 1); i <= reached; i++) {
      const seg = nodes[i]?.querySelector<HTMLElement>("[data-seg]");
      if (!seg) continue;
      const vertical = seg.offsetHeight > seg.offsetWidth;
      seg.style.transformOrigin = vertical ? "50% 0" : "0 50%";
      seg.animate([{ transform: vertical ? "scaleY(0)" : "scaleX(0)" }, { transform: "none" }], { ...timing, delay: step * MOTION_DURATION.ui });
      const dot = nodes[i]?.querySelector<HTMLElement>("[data-dot]");
      dot?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION_DURATION.micro, easing: cssEase("std"), fill: "backwards", delay: step * MOTION_DURATION.ui + 420 });
      step += 1;
    }
  }, [status]);

  return <span ref={ref} hidden />;
}
