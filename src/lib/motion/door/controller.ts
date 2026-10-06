import { frozenTime, onIdle, webglAllowed, type MotionEnv } from "../env";
import { addTick, clamp, cubicBezier, damp, spring, stepSpring } from "../ticker";
import { MOTION_EASE } from "../tokens";
import { pinSpacer } from "../scenes/releases";
import { DOOR_TIMELINE } from "./geometry";
import type { DoorScene } from "./scene";
import type { VaultCoverInput } from "./surfaces";

const latch = cubicBezier(...MOTION_EASE.latch);
const INTRO_DEG = 36;
const INTRO_MS = 500;
const SLOW_FRAME = 24;
const WINDOW = 90;
const PIN_VH = 1;
const MAP_FROM = 0.7;
const DESKTOP_WIDTH = 1024;

function frozenProgress(): number | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("p")) return null;
  return clamp(Number(params.get("p")) || 0, 0, 1);
}

function visibleFraction(el: Element): number {
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  const shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return clamp(shown / r.height, 0, 1);
}

function readCovers(slot: HTMLElement, root: HTMLElement): { covers: VaultCoverInput[]; items: HTMLElement[] } {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-door-contents] > li"));
  const listed = items.map((li) => ({
    src: li.querySelector("img")?.getAttribute("src") ?? "",
    title: li.querySelector("a")?.getAttribute("aria-label") ?? undefined,
  }));
  if (listed.some((c) => c.src)) return { covers: listed, items };
  try {
    const parsed: unknown = JSON.parse(slot.dataset.covers ?? "[]");
    if (!Array.isArray(parsed)) return { covers: [], items: [] };
    const covers = parsed
      .map((entry) => (typeof entry === "string" ? { src: entry } : entry && typeof entry === "object" && "src" in entry ? { src: String((entry as { src: unknown }).src), title: String((entry as { title?: unknown }).title ?? "") || undefined } : null))
      .filter((c): c is VaultCoverInput => Boolean(c?.src));
    return { covers, items: [] };
  } catch {
    return { covers: [], items: [] };
  }
}

function mountSwing(stage: HTMLElement, poster: HTMLElement | null, desktop: boolean): () => void {
  stage.dataset.doorMode = "css";
  if (!poster) return () => delete stage.dataset.doorMode;
  if (!desktop && visibleFraction(poster) >= 0.5) return () => delete stage.dataset.doorMode;
  poster.dataset.doorSwing = "armed";
  let frame = 0;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      frame = window.requestAnimationFrame(() => {
        poster.dataset.doorSwing = "open";
      });
    },
    { threshold: 0.5 },
  );
  io.observe(poster);
  return () => {
    io.disconnect();
    window.cancelAnimationFrame(frame);
    delete poster.dataset.doorSwing;
    delete stage.dataset.doorMode;
  };
}

function stickyChild(root: HTMLElement, stage: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = stage;
  while (el && el.parentElement !== root) el = el.parentElement;
  return el;
}

export function mountVaultDoor(slot: HTMLElement, env: MotionEnv): () => void {
  const stage = slot.closest<HTMLElement>("[data-door]") ?? slot.parentElement ?? slot;
  const root = slot.closest<HTMLElement>('[data-scene="vault-door"]') ?? slot.closest<HTMLElement>("section") ?? stage;
  const poster = stage.querySelector<HTMLElement>("[data-door-poster]");
  const pinnedP = frozenProgress();
  const pinnedT = frozenTime();
  const forced = pinnedP !== null || pinnedT !== null;
  const desktop = window.innerWidth >= DESKTOP_WIDTH;
  if (stage.dataset.doorMode || document.querySelector("canvas[data-door-gl]")) return () => {};

  if (env.reduced) {
    stage.dataset.doorMode = "static";
    return () => delete stage.dataset.doorMode;
  }
  if (!(forced || webglAllowed(env))) return mountSwing(stage, poster, desktop);

  const { covers, items } = readCovers(slot, root);
  const canvas = document.createElement("canvas");
  canvas.dataset.doorGl = "";
  canvas.setAttribute("aria-hidden", "true");
  slot.appendChild(canvas);
  const contents = root.querySelector<HTMLElement>("[data-door-contents]");
  const sticky = stickyChild(root, stage);

  let disposed = false;
  let scene: DoorScene | null = null;
  let running = false;
  let stopTick: (() => void) | null = null;
  let cleanupFallback: (() => void) | null = null;
  let visible = true;
  let firstFrame = false;
  let introStart = 0;
  let target = 0;
  let progress = 0;
  let pin = 0;
  let pinned = false;
  let spacer: HTMLElement | null = null;
  let focusInside = false;
  let mapped = false;
  const dial = spring(INTRO_DEG);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const durations: number[] = [];

  const unpin = () => {
    pinned = false;
    spacer?.remove();
    spacer = null;
    delete root.dataset.doorPin;
    if (sticky) delete sticky.dataset.doorSticky;
  };

  const layoutPin = () => {
    if (!pinned) return;
    pin = Math.round(window.innerHeight * PIN_VH);
    if (spacer) spacer.style.height = `${pin}px`;
  };

  const clearMap = () => {
    if (!mapped) return;
    mapped = false;
    contents?.style.removeProperty("clip-path");
    for (const li of items) {
      li.style.left = "";
      li.style.top = "";
      li.style.width = "";
      li.style.height = "";
      delete li.dataset.mapped;
    }
  };

  const fallback = () => {
    scene?.dispose();
    scene = null;
    stopTick?.();
    running = false;
    canvas.remove();
    clearMap();
    unpin();
    delete stage.dataset.doorLive;
    delete root.dataset.doorOpen;
    if (!disposed && !cleanupFallback) cleanupFallback = mountSwing(stage, poster, desktop);
  };

  const measure = () => {
    if (pinnedP !== null) return pinnedP;
    const rect = root.getBoundingClientRect();
    if (pinned && sticky && pin > 0) {
      const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
      return clamp((stickTop - rect.top) / pin, 0, 1);
    }
    return clamp(-rect.top / Math.max(1, rect.height * 0.8), 0, 1);
  };

  const introOffset = (now: number) => {
    if (pinnedT !== null) return INTRO_DEG * (1 - latch(clamp((pinnedT * 1000) / INTRO_MS, 0, 1)));
    if (!introStart) return INTRO_DEG;
    return INTRO_DEG * (1 - latch(clamp((now - introStart) / INTRO_MS, 0, 1)));
  };

  const mapContents = () => {
    if (!scene || items.length === 0) return;
    if (progress < MAP_FROM && !focusInside) {
      clearMap();
      return;
    }
    mapped = true;
    const hole = scene.aperture();
    contents?.style.setProperty("clip-path", `circle(${hole.r.toFixed(1)}px at ${hole.x.toFixed(1)}px ${hole.y.toFixed(1)}px)`);
    items.forEach((li, i) => {
      const rect = scene?.coverRect(i);
      if (!rect) {
        delete li.dataset.mapped;
        return;
      }
      li.dataset.mapped = "";
      li.style.left = `${rect.x.toFixed(1)}px`;
      li.style.top = `${rect.y.toFixed(1)}px`;
      li.style.width = `${rect.w.toFixed(1)}px`;
      li.style.height = `${rect.h.toFixed(1)}px`;
    });
  };

  const draw = (now: number) => {
    if (!scene) return;
    scene.render({ progress, dial: dial.value + introOffset(now), pointerX: pointer.x, pointerY: pointer.y });
    root.toggleAttribute("data-door-open", progress >= DOOR_TIMELINE.contents);
    mapContents();
    if (!firstFrame) {
      firstFrame = true;
      introStart = now;
      stage.dataset.doorLive = "";
    }
  };

  const adapt = (dt: number) => {
    durations.push(dt);
    if (durations.length < WINDOW) return true;
    const slow = durations.filter((d) => d > SLOW_FRAME).length;
    durations.length = 0;
    if (slow * 2 < WINDOW || !scene || forced) return true;
    if (scene.dpr() > 1) {
      scene.setDpr(Math.max(1, scene.dpr() * 0.75));
      return true;
    }
    fallback();
    return false;
  };

  const tick = (dt: number, now: number) => {
    if (!scene || !visible || disposed) {
      running = false;
      return false;
    }
    if (!adapt(dt)) return false;
    const s = dt / 1000;
    progress = pinnedP ?? damp(progress, target, 9, s);
    if (Math.abs(progress - target) < 1e-4) progress = target;
    let dialSettled = true;
    if (pinnedP !== null) dial.value = scene.dialAt(progress);
    else dialSettled = stepSpring(dial, scene.dialAt(progress), dt);
    pointer.x = damp(pointer.x, pointer.tx, 7, s);
    pointer.y = damp(pointer.y, pointer.ty, 7, s);
    draw(now);
    const introDone = pinnedT !== null || (introStart > 0 && now - introStart > INTRO_MS);
    const settled = progress === target && dialSettled && introDone && Math.abs(pointer.x - pointer.tx) < 1e-3 && Math.abs(pointer.y - pointer.ty) < 1e-3;
    if (settled || pinnedP !== null) {
      running = false;
      durations.length = 0;
      return false;
    }
    return true;
  };

  const wake = () => {
    if (running || !scene || !visible || disposed) return;
    running = true;
    stopTick = addTick(tick);
  };

  const onScroll = () => {
    target = measure();
    wake();
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || forced) return;
    pointer.tx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    pointer.ty = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
    wake();
  };
  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) wake();
  };
  const onFocusIn = () => {
    focusInside = true;
    root.dataset.doorFocus = "";
    if (pinned && progress < DOOR_TIMELINE.contents && sticky) {
      const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
      window.scrollTo({ top: window.scrollY + root.getBoundingClientRect().top - stickTop + pin, behavior: "instant" });
    }
    if (scene) draw(performance.now());
  };
  const onFocusOut = (e: FocusEvent) => {
    if (contents?.contains(e.relatedTarget as Node | null)) return;
    focusInside = false;
    delete root.dataset.doorFocus;
    if (scene) draw(performance.now());
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting) && !document.hidden;
    if (visible) wake();
  });
  const resize = new ResizeObserver(() => {
    layoutPin();
    scene?.resize();
    target = measure();
    if (scene) {
      draw(performance.now());
      wake();
    }
  });

  stage.dataset.doorMode = "gl";
  const cancelIdle = onIdle(() => {
    import("./scene").then(async ({ createDoorScene }) => {
      if (disposed) return;
      const created = await createDoorScene(canvas, { forced, covers, onLost: fallback, onInvalidate: () => scene && draw(performance.now()) });
      if (disposed) {
        created?.dispose();
        return;
      }
      if (!created) {
        fallback();
        return;
      }
      scene = created;
      const top = root.getBoundingClientRect().top;
      if (pinnedP === null && desktop && sticky && top > -1) {
        pinned = true;
        root.dataset.doorPin = "";
        sticky.dataset.doorSticky = "";
        spacer = pinSpacer(sticky);
        layoutPin();
      }
      target = measure();
      progress = target;
      dial.value = created.dialAt(progress);
      dial.velocity = 0;
      draw(performance.now());
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      contents?.addEventListener("focusin", onFocusIn);
      contents?.addEventListener("focusout", onFocusOut);
      io.observe(stage);
      resize.observe(canvas);
      wake();
    }, fallback);
  });

  return () => {
    disposed = true;
    cancelIdle();
    stopTick?.();
    io.disconnect();
    resize.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    contents?.removeEventListener("focusin", onFocusIn);
    contents?.removeEventListener("focusout", onFocusOut);
    scene?.dispose();
    scene = null;
    cleanupFallback?.();
    canvas.remove();
    clearMap();
    unpin();
    delete stage.dataset.doorMode;
    delete stage.dataset.doorLive;
    delete root.dataset.doorOpen;
    delete root.dataset.doorFocus;
  };
}
