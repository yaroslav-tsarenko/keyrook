import { interactiveDesktop, type MotionEnv } from "../env";
import { addTick, clamp, lerpPerFrame } from "../ticker";
import { MOTION_DEPTH } from "../tokens";

type Layer = keyof typeof MOTION_DEPTH;

interface Item {
  el: HTMLElement;
  door: HTMLElement | null;
  target: HTMLElement;
  amp: number;
  scale: number;
  s: number;
  x: number;
  y: number;
  visible: boolean;
}

const INNER = "[data-door-contents], [data-cover] img";
const COVER_SCALE = 1.04;

function itemFor(el: HTMLElement): Item | null {
  const layer = el.dataset.depth as Layer;
  const depth = MOTION_DEPTH[layer];
  if (!depth || depth.pointer === 0) return null;
  const inner = layer === "D3" ? el.querySelector<HTMLElement>(INNER) : null;
  const custom = Number(el.dataset.depthAmp);
  const amp = Number.isFinite(custom) && custom > 0 ? custom : inner ? 4 : depth.pointer;
  return { el, door: el.closest<HTMLElement>("[data-door]"), target: inner ?? el, amp: inner ? -amp : amp, scale: inner?.tagName === "IMG" ? COVER_SCALE : 1, s: 1, x: 0, y: 0, visible: false };
}

export function mountDepth(root: Document, env: MotionEnv): () => void {
  if (!interactiveDesktop(env)) return () => {};
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"))
    .map(itemFor)
    .filter((i): i is Item => Boolean(i));
  if (items.length === 0) return () => {};

  const pointer = { x: 0, y: 0 };
  let running = false;
  let stop: (() => void) | null = null;

  const write = (item: Item) => {
    item.target.style.translate = `${item.x.toFixed(2)}px ${item.y.toFixed(2)}px`;
    if (item.scale !== 1) item.target.style.scale = item.s.toFixed(4);
  };

  const tick = (dt: number) => {
    let moving = false;
    for (const item of items) {
      if (!item.visible || item.door?.hasAttribute("data-door-live")) continue;
      const tx = pointer.x * item.amp;
      const ty = pointer.y * item.amp;
      item.x = lerpPerFrame(item.x, tx, 0.1, dt);
      item.y = lerpPerFrame(item.y, ty, 0.1, dt);
      item.s = lerpPerFrame(item.s, item.scale, 0.1, dt);
      if (Math.abs(item.x - tx) > 0.02 || Math.abs(item.y - ty) > 0.02 || Math.abs(item.s - item.scale) > 0.0005) moving = true;
      else {
        item.x = tx;
        item.y = ty;
        item.s = item.scale;
      }
      write(item);
    }
    if (!moving) running = false;
    return moving;
  };

  const wake = () => {
    if (running) return;
    running = true;
    stop = addTick(tick);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointer.x = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    pointer.y = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
    wake();
  };

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const item = items.find((i) => i.el === entry.target);
      if (item) item.visible = entry.isIntersecting;
    }
  });
  for (const item of items) io.observe(item.el);
  window.addEventListener("pointermove", onMove, { passive: true });

  return () => {
    window.removeEventListener("pointermove", onMove);
    io.disconnect();
    stop?.();
    for (const item of items) {
      item.target.style.translate = "";
      item.target.style.scale = "";
    }
  };
}
