import type { MotionEnv } from "../env";
import { cssEase, MOTION_DURATION, MOTION_STAGGER } from "../tokens";

const TICK_PX = 8;

function trailFor(ruler: HTMLElement): HTMLElement | null {
  const band = ruler.querySelector<HTMLElement>("[data-index-track]")?.parentElement;
  if (!band) return null;
  let trail = band.querySelector<HTMLElement>(":scope > [data-index-trail]");
  if (!trail) {
    trail = document.createElement("span");
    trail.dataset.indexTrail = "";
    trail.setAttribute("aria-hidden", "true");
    band.appendChild(trail);
  }
  return trail;
}

export function mountIndexSlide(root: Document, env: MotionEnv): () => void {
  if (env.reduced) return () => {};
  const rulers = Array.from(root.querySelectorAll<HTMLElement>("[data-dial-ruler]"));
  if (rulers.length === 0) return () => {};
  const last = new Map<HTMLElement, number>(rulers.map((r) => [r, Number(r.dataset.index) || 0]));
  const running = new Set<Animation>();

  const slide = (ruler: HTMLElement) => {
    const next = Number(ruler.dataset.index) || 0;
    const prev = last.get(ruler) ?? next;
    last.set(ruler, next);
    if (next === prev) return;
    const detents = ruler.querySelectorAll("ol > li").length;
    const trail = trailFor(ruler);
    if (!trail || detents < 2) return;
    const span = detents - 1;
    const from = (prev / span) * 100;
    const to = (next / span) * 100;
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const width = trail.parentElement?.clientWidth ?? 0;
    const ticks = Math.max(1, Math.round((((hi - lo) / 100) * width) / TICK_PX));
    const travel = MOTION_DURATION.panel;
    const settle = ticks * MOTION_STAGGER.ticks;
    const head = (p: number) => (from < to ? `inset(0 ${100 - p}% 0 ${lo}%)` : `inset(0 ${100 - hi}% 0 ${p}%)`);
    const tail = (p: number) => (from < to ? `inset(0 ${100 - hi}% 0 ${p}%)` : `inset(0 ${100 - p}% 0 ${lo}%)`);
    const forward = from < to;
    const lit = trail.animate(
      [
        { clipPath: head(forward ? lo : hi), opacity: 1 },
        { clipPath: head(forward ? hi : lo), opacity: 1, offset: travel / (travel + settle) },
        { clipPath: tail(forward ? hi : lo), opacity: 1 },
      ],
      { duration: travel + settle, easing: cssEase("latch"), fill: "none" },
    );
    running.add(lit);
    lit.finished.then(
      () => running.delete(lit),
      () => running.delete(lit),
    );
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) slide(record.target as HTMLElement);
  });
  for (const ruler of rulers) observer.observe(ruler, { attributes: true, attributeFilter: ["data-index"] });

  return () => {
    observer.disconnect();
    for (const a of running) a.cancel();
    for (const ruler of rulers) ruler.querySelector("[data-index-trail]")?.remove();
  };
}
