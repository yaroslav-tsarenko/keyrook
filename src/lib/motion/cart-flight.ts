import { cubicBezier } from "./ticker";
import { cssEase, MOTION_DURATION, MOTION_EASE, MOTION_LIMITS, MOTION_STAGGER } from "./tokens";

const latch = cubicBezier(...MOTION_EASE.latch);
const ARC_STEPS = 12;

export interface CartAddDetail {
  productId?: string;
  source?: Element | null;
}

let landsAt = 0;
const arrivals = new WeakMap<HTMLElement, number>();

export function flightRemaining(): number {
  return Math.max(0, landsAt - performance.now());
}

function visibleRect(el: Element | null | undefined): DOMRect | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return null;
  return rect;
}

function pickCover(source: Element | null): HTMLElement | null {
  if (!source) return null;
  const scope = source.closest("[data-product]") ?? source;
  const candidates = [source.matches("[data-cover]") ? source : null, ...Array.from(source.querySelectorAll("[data-cover]")), ...Array.from(scope.querySelectorAll("[data-cover]"))];
  return (candidates.find((el) => el && el.querySelector("img") && visibleRect(el)) as HTMLElement | undefined) ?? null;
}

export function flyToCart(detail: CartAddDetail | undefined) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const stage = pickCover(detail?.source ?? null);
  const img = stage?.querySelector<HTMLImageElement>("img") ?? null;
  const from = visibleRect(stage);
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  const target = targets.map((el) => ({ el, rect: visibleRect(el) })).find((t) => t.rect);
  if (!from || !img || !target?.rect) return;

  const size = Math.min(from.width, from.height);
  const startX = from.left + (from.width - size) / 2;
  const startY = from.top + (from.height - size) / 2;
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: "85",
    pointerEvents: "none",
    padding: `${size * 0.1}px`,
    transformOrigin: "0 0",
    willChange: "transform, opacity",
  });
  const picture = document.createElement("img");
  picture.src = img.currentSrc || img.src;
  picture.alt = "";
  Object.assign(picture.style, { width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" });
  ghost.appendChild(picture);
  document.body.appendChild(ghost);
  landsAt = performance.now() + MOTION_DURATION.cartFlight;
  window.clearTimeout(arrivals.get(target.el));
  target.el.dataset.arriving = "";

  const scale = MOTION_LIMITS.cartGhost / size;
  const endX = target.rect.left + target.rect.width / 2 - MOTION_LIMITS.cartGhost / 2;
  const endY = target.rect.top + target.rect.height / 2 - MOTION_LIMITS.cartGhost / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const lift = Math.min(160, Math.max(48, Math.hypot(dx, dy) * 0.22));
  const frames: Keyframe[] = [];
  for (let i = 0; i <= ARC_STEPS; i++) {
    const t = latch(i / ARC_STEPS);
    const x = dx * t;
    const y = dy * t - lift * 4 * t * (1 - t);
    const k = 1 + (scale - 1) * t;
    frames.push({ offset: i / ARC_STEPS, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${k.toFixed(4)})`, opacity: MOTION_LIMITS.cartGhostOpacity + (0.35 - MOTION_LIMITS.cartGhostOpacity) * t });
  }
  const flight = ghost.animate(frames, { duration: MOTION_DURATION.cartFlight, easing: "linear", fill: "forwards" });

  const land = () => {
    ghost.remove();
    const lid = target.el.querySelector<SVGElement>("[data-cart-glyph] > rect:first-child");
    lid?.animate([{ transform: "translateY(0)" }, { transform: "translateY(-2px)", offset: 0.5 }, { transform: "translateY(0)" }], { duration: MOTION_DURATION.micro, easing: cssEase("latch") });
    arrivals.set(
      target.el,
      window.setTimeout(() => delete target.el.dataset.arriving, MOTION_DURATION.tumbler + MOTION_STAGGER.tumblers * 6),
    );
  };
  flight.finished.then(land, () => {
    ghost.remove();
    delete target.el.dataset.arriving;
  });
}
