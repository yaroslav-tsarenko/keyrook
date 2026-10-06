import { cssEase, MOTION_DURATION, MOTION_LIMITS } from "./tokens";

export interface CartAddDetail {
  productId?: string;
  source?: Element | null;
}

let landsAt = 0;

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

export function flyToCart(detail: CartAddDetail | undefined) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const source = detail?.source ?? null;
  const stage = source?.matches?.("[data-cover]") ? (source as HTMLElement) : source?.querySelector<HTMLElement>("[data-cover]") ?? null;
  const img = stage?.querySelector<HTMLImageElement>("img") ?? null;
  const from = visibleRect(stage ?? img);
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
  target.el.dataset.arriving = "";

  const scale = MOTION_LIMITS.cartGhost / size;
  const endX = target.rect.left + target.rect.width / 2 - MOTION_LIMITS.cartGhost / 2;
  const endY = target.rect.top + target.rect.height / 2 - MOTION_LIMITS.cartGhost / 2;
  const flight = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: MOTION_LIMITS.cartGhostOpacity },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(${scale})`, opacity: 0.35 },
    ],
    { duration: MOTION_DURATION.cartFlight, easing: cssEase("instrument"), fill: "forwards" },
  );

  const land = () => {
    ghost.remove();
    target.el.animate([{ transform: "translateY(1px)" }, { transform: "translateY(0)" }], { duration: MOTION_DURATION.micro, easing: cssEase("instrument") });
    window.setTimeout(() => delete target.el.dataset.arriving, MOTION_DURATION.ui + 40);
  };
  flight.finished.then(land, () => {
    ghost.remove();
    delete target.el.dataset.arriving;
  });
}
