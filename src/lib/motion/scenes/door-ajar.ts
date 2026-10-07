import { interactiveDesktop, type MotionEnv } from "../env";
import { addTick, clamp, lerpPerFrame } from "../ticker";

const SWAY_DEG = 4;
const COVERS_PX = 6;

export function mountDoorAjar(section: HTMLElement, env: MotionEnv): () => void {
  if (!interactiveDesktop(env)) return () => {};
  const leaf = section.querySelector<HTMLElement>("[data-door-leaf]");
  const covers = section.querySelector<HTMLElement>("[data-door-covers]");
  if (!leaf) return () => {};
  let target = 0;
  let x = 0;
  let visible = false;
  let running = false;
  let stop: (() => void) | null = null;

  const tick = (dt: number) => {
    x = lerpPerFrame(x, target, 0.1, dt);
    if (Math.abs(x - target) < 0.002) x = target;
    leaf.style.setProperty("--door-sway", `${(-x * SWAY_DEG).toFixed(3)}deg`);
    if (covers) covers.style.transform = `translate3d(${(x * COVERS_PX).toFixed(2)}px, 0, 0)`;
    if (x === target) {
      running = false;
      return false;
    }
    return true;
  };

  const onMove = (e: PointerEvent) => {
    if (!visible || e.pointerType !== "mouse") return;
    const r = section.getBoundingClientRect();
    target = clamp(((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1, -1, 1);
    if (running) return;
    running = true;
    stop = addTick(tick);
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  });
  leaf.style.transitionDuration = "0ms";
  io.observe(section);
  window.addEventListener("pointermove", onMove, { passive: true });

  return () => {
    window.removeEventListener("pointermove", onMove);
    io.disconnect();
    stop?.();
    leaf.style.removeProperty("--door-sway");
    leaf.style.transitionDuration = "";
    if (covers) covers.style.transform = "";
  };
}
