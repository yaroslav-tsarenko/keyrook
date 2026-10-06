import { interactiveDesktop, type MotionEnv } from "../env";
import { addTick, clamp, damp } from "../ticker";
import { MOTION_DEPTH } from "../tokens";

const MAX_PIN_VH = 1.4;
const HEADER_FALLBACK = 56;

type Layer = keyof typeof MOTION_DEPTH;

export function pinSpacer(after: HTMLElement): HTMLElement {
  const spacer = document.createElement("div");
  spacer.setAttribute("aria-hidden", "true");
  spacer.dataset.pinSpacer = "";
  after.after(spacer);
  return spacer;
}

export function mountReleasePin(pinEl: HTMLElement, env: MotionEnv): () => void {
  if (!interactiveDesktop(env)) return () => {};
  const viewport = pinEl.querySelector<HTMLElement>("[data-pin-viewport], [data-release-scroller]");
  const track = pinEl.querySelector<HTMLElement>("[data-pin-track], [data-release-track]");
  if (!viewport || !track) return () => {};
  const start = pinEl.getBoundingClientRect();
  if (start.top < window.innerHeight && start.bottom > 0) return () => {};
  if (track.scrollWidth - viewport.clientWidth <= 0) return () => {};

  const layers = Array.from(track.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => ({ el, speed: MOTION_DEPTH[el.dataset.depth as Layer]?.scroll ?? 0 }));
  const spacer = pinSpacer(pinEl);
  let travel = 0;
  let pin = 0;
  let pinTop = HEADER_FALLBACK;
  let target = 0;
  let current = 0;
  let running = false;
  let stop: (() => void) | null = null;

  const layout = () => {
    pinEl.dataset.pinLive = "";
    viewport.scrollLeft = 0;
    travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
    pin = Math.min(travel, window.innerHeight * MAX_PIN_VH);
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height-compact")) || HEADER_FALLBACK;
    pinTop = Math.max(header, Math.round((window.innerHeight + header - pinEl.offsetHeight) / 2));
    pinEl.style.setProperty("--pin-top", `${pinTop}px`);
    spacer.style.height = `${Math.round(pin)}px`;
  };

  const measure = () => {
    const top = spacer.getBoundingClientRect().top;
    target = pin > 0 ? clamp((pinTop + pinEl.offsetHeight - top) / pin, 0, 1) : 0;
  };

  const write = () => {
    track.style.transform = `translate3d(${(-travel * current).toFixed(1)}px, 0, 0)`;
    for (const layer of layers) layer.el.style.translate = `${((current - 0.5) * travel * layer.speed).toFixed(1)}px 0`;
  };

  const tick = (dt: number) => {
    current = damp(current, target, 10, dt / 1000);
    if (Math.abs(current - target) < 1e-4) current = target;
    write();
    if (current === target) {
      running = false;
      return false;
    }
    return true;
  };

  const onScroll = () => {
    measure();
    if (running) return;
    running = true;
    stop = addTick(tick);
  };

  const resize = new ResizeObserver(() => {
    layout();
    onScroll();
  });

  layout();
  measure();
  current = target;
  write();
  resize.observe(viewport);
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    resize.disconnect();
    stop?.();
    spacer.remove();
    delete pinEl.dataset.pinLive;
    pinEl.style.removeProperty("--pin-top");
    track.style.transform = "";
    for (const layer of layers) layer.el.style.translate = "";
  };
}
