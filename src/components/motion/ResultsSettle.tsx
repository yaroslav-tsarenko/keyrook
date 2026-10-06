"use client";

import { useLayoutEffect, useRef } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/hooks/useMediaQuery";
import { cssEase, MOTION_DURATION, MOTION_STAGGER } from "@/lib/motion/tokens";

const MAX_STAGGERED = 10;

export function ResultsSettle({ keys }: { keys: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<Set<string> | null>(null);
  const signature = keys.join("|");

  useLayoutEffect(() => {
    const before = previous.current;
    const current = new Set(signature ? signature.split("|") : []);
    previous.current = current;
    const grid = ref.current?.parentElement;
    if (!before || !grid || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const fresh = Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-card]")).filter((card) => {
      const href = card.querySelector("a[data-card-link]")?.getAttribute("href");
      return href ? !before.has(href) : false;
    });
    if (fresh.length === 0) return;
    const fold = window.innerHeight;
    let step = 0;
    for (const card of fresh) {
      const rect = card.getBoundingClientRect();
      if (rect.top > fold || rect.bottom < 0) continue;
      card.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], {
        duration: MOTION_DURATION.panel,
        easing: cssEase("latch"),
        delay: Math.min(step, MAX_STAGGERED) * (MOTION_STAGGER.rows / 2),
        fill: "backwards",
      });
      step += 1;
    }
  }, [signature]);

  return <span ref={ref} hidden data-results-settle="" />;
}
