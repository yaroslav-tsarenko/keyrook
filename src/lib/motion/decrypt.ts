import { decryptGlyph } from "@/lib/keys/decrypt";
import { addTick, cubicBezier } from "./ticker";
import { MOTION_DURATION, MOTION_EASE } from "./tokens";

const ease = cubicBezier(...MOTION_EASE.std);

export function runDecrypt(slots: HTMLElement[], onDone: () => void): () => void {
  const key = slots.map((slot) => slot.textContent ?? "").join("");
  let done = false;
  const finish = (notify: boolean) => {
    done = true;
    for (const slot of slots) {
      delete slot.dataset.glyph;
      delete slot.dataset.phase;
    }
    if (notify) onDone();
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || slots.length === 0) {
    finish(true);
    return () => {};
  }
  const paint = (progress: number) => {
    slots.forEach((slot, i) => {
      const glyph = decryptGlyph(key, i, progress);
      if (glyph.phase === "done") {
        if (slot.dataset.glyph !== undefined) delete slot.dataset.glyph;
        if (slot.dataset.phase !== undefined) delete slot.dataset.phase;
        return;
      }
      if (slot.dataset.glyph !== glyph.char) slot.dataset.glyph = glyph.char;
      if (slot.dataset.phase !== glyph.phase) slot.dataset.phase = glyph.phase;
    });
  };
  paint(0);
  const start = performance.now();
  const stop = addTick((_dt, now) => {
    if (done) return false;
    const t = Math.min(1, (now - start) / MOTION_DURATION.decrypt);
    paint(ease(t));
    if (t < 1) return true;
    finish(true);
    return false;
  });
  return () => {
    if (done) return;
    stop();
    finish(false);
  };
}
