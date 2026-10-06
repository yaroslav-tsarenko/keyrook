import type { MotionEnv } from "../env";
import { cssEase, MOTION_DURATION, MOTION_STAGGER } from "../tokens";

const DIGIT = /^[0-9]$/;
const BETWEEN_NUMBERS = 120;

interface Wheel {
  slot: HTMLElement;
  glyph: HTMLElement;
  strip: HTMLElement;
  steps: number;
}

function sequence(digit: number, fromZero: boolean, extraTurn: boolean): number[] {
  const out: number[] = [];
  const start = fromZero ? 0 : digit;
  const length = (fromZero ? digit : 10) + (extraTurn ? 10 : 0);
  for (let i = 0; i <= length; i++) out.push((start + i) % 10);
  return out;
}

function arm(tumbler: HTMLElement, fromZero: boolean): Wheel[] {
  const slots = Array.from(tumbler.querySelectorAll<HTMLElement>("[data-slot]")).filter((slot) => DIGIT.test(slot.textContent ?? ""));
  return slots.map((slot, i) => {
    const glyph = slot.querySelector<HTMLElement>("[data-glyph]") ?? slot;
    const digit = Number(slot.textContent);
    const digits = sequence(digit, fromZero, i === slots.length - 1);
    const strip = document.createElement("span");
    strip.setAttribute("aria-hidden", "true");
    strip.dataset.tumblerStrip = "";
    strip.textContent = digits.join("\n");
    slot.style.position = "relative";
    glyph.style.visibility = "hidden";
    slot.appendChild(strip);
    return { slot, glyph, strip, steps: digits.length - 1 };
  });
}

function release(wheels: Wheel[]) {
  for (const w of wheels) {
    w.strip.remove();
    w.glyph.style.visibility = "";
    w.slot.style.position = "";
  }
}

function roll(wheels: Wheel[], delay: number): Promise<void> {
  const last = wheels.length - 1;
  const runs = wheels.map((w, i) =>
    w.strip.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-w.steps * 1.45}em)` }], {
      duration: MOTION_DURATION.tumbler + w.steps * 12,
      delay: delay + (last - i) * MOTION_STAGGER.tumblers,
      easing: cssEase("latch"),
      fill: "both",
    }).finished,
  );
  return Promise.all(runs).then(
    () => undefined,
    () => undefined,
  );
}

export function mountTumblers(root: Document, env: MotionEnv): () => void {
  if (env.reduced) return () => {};
  const tumblers = Array.from(root.querySelectorAll<HTMLElement>("[data-tumbler][data-tumbler-motion]"));
  if (tumblers.length === 0) return () => {};
  const armed = new Map<HTMLElement, Wheel[]>();
  let cancelled = false;

  for (const t of tumblers) {
    const rect = t.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    armed.set(t, arm(t, !inView));
  }

  const queue: HTMLElement[] = [];
  let busyUntil = 0;
  const start = (t: HTMLElement) => {
    const wheels = armed.get(t);
    if (!wheels) return;
    armed.delete(t);
    const now = performance.now();
    const delay = Math.max(0, busyUntil - now);
    busyUntil = now + delay + BETWEEN_NUMBERS;
    roll(wheels, delay).then(() => {
      if (!cancelled) release(wheels);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        queue.push(entry.target as HTMLElement);
      }
      queue.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      while (queue.length) start(queue.shift() as HTMLElement);
    },
    { threshold: 0.6 },
  );
  for (const t of tumblers) io.observe(t);

  return () => {
    cancelled = true;
    io.disconnect();
    for (const wheels of armed.values()) release(wheels);
    armed.clear();
    for (const t of tumblers) for (const strip of Array.from(t.querySelectorAll<HTMLElement>("[data-tumbler-strip]"))) strip.remove();
    for (const t of tumblers)
      for (const slot of Array.from(t.querySelectorAll<HTMLElement>("[data-slot]"))) {
        slot.style.position = "";
        const glyph = slot.querySelector<HTMLElement>("[data-glyph]");
        if (glyph) glyph.style.visibility = "";
      }
  };
}
