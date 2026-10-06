import { onIdle } from "@/lib/motion/env";

export function afterLoadIdle(task: () => void, timeout = 1500): () => void {
  let cancelIdle: (() => void) | null = null;
  const run = () => {
    cancelIdle = onIdle(task, timeout);
  };
  if (document.readyState === "complete") {
    run();
    return () => cancelIdle?.();
  }
  window.addEventListener("load", run, { once: true });
  return () => {
    window.removeEventListener("load", run);
    cancelIdle?.();
  };
}

const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

export function onFirstInteraction(task: () => void): () => void {
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    off();
    task();
  };
  const off = () => EVENTS.forEach((e) => window.removeEventListener(e, fire));
  EVENTS.forEach((e) => window.addEventListener(e, fire, { passive: true, once: true }));
  return () => {
    done = true;
    off();
  };
}
