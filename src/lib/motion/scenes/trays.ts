import { addTick, clamp, lerpPerFrame, spring, stepSpring, type Spring } from "../ticker";
import { interactiveDesktop, type MotionEnv } from "../env";
import { LAMP_POSE, MOTION_LIMITS } from "../tokens";

interface Target {
  stage: HTMLElement;
  tray: HTMLElement | null;
  render: HTMLElement | null;
  max: number;
  rx: Spring;
  ry: Spring;
  lift: Spring;
  lx: number;
  ly: number;
  goal: { rx: number; ry: number; lift: number; lx: number; ly: number };
  trayRect: DOMRect | null;
  stageRect: DOMRect;
  scrollY: number;
}

const OWNED = "[data-scene=bay-hero], [data-scene=inspect]";

export function mountTrays(root: Document, env: MotionEnv): () => void {
  if (!interactiveDesktop(env)) return () => {};
  const targets = new Map<HTMLElement, Target>();
  let active: Target | null = null;
  let stopTick: (() => void) | null = null;
  let last = { x: 0, y: 0 };
  let recheck = false;

  const rest = (t: Target) => {
    t.goal = { rx: 0, ry: 0, lift: 0, lx: LAMP_POSE.rest.x, ly: LAMP_POSE.rest.y };
    t.stage.style.removeProperty("--lamp-level");
  };

  const aim = (t: Target, x: number, y: number) => {
    const shift = window.scrollY - t.scrollY;
    const trayRect = t.trayRect;
    if (trayRect) {
      const nx = clamp(((x - trayRect.left) / trayRect.width) * 2 - 1, -1, 1);
      const ny = clamp(((y - (trayRect.top - shift)) / trayRect.height) * 2 - 1, -1, 1);
      t.goal.ry = nx * t.max;
      t.goal.rx = -ny * t.max;
      t.goal.lift = -MOTION_LIMITS.liftCatalog;
    }
    t.goal.lx = clamp((x - t.stageRect.left) / t.stageRect.width, -0.1, 1.1);
    t.goal.ly = clamp((y - (t.stageRect.top - shift)) / t.stageRect.height, -0.1, 1.1);
  };

  const write = (t: Target) => {
    t.stage.style.setProperty("--lx", `${(t.lx * 100).toFixed(2)}%`);
    t.stage.style.setProperty("--ly", `${(t.ly * 100).toFixed(2)}%`);
    if (t.tray) {
      t.tray.style.transform = `perspective(${MOTION_LIMITS.perspectiveTray}px) translateY(${t.lift.value.toFixed(2)}px) rotateX(${t.rx.value.toFixed(3)}deg) rotateY(${t.ry.value.toFixed(3)}deg)`;
      if (t.render && t.max > 0) {
        const k = MOTION_LIMITS.renderInStage / t.max;
        t.render.style.translate = `${(-t.ry.value * k).toFixed(2)}px ${(t.rx.value * k).toFixed(2)}px`;
      }
    }
  };

  const clear = (t: Target) => {
    t.stage.style.removeProperty("--lx");
    t.stage.style.removeProperty("--ly");
    t.stage.style.removeProperty("--lamp-level");
    if (t.tray) {
      t.tray.style.transform = "";
      t.tray.style.transition = "";
    }
    if (t.render) t.render.style.translate = "";
  };

  const resolve = (el: Element | null): { stage: HTMLElement; tray: HTMLElement | null } | null => {
    if (!el || el.closest(OWNED)) return null;
    const tray = el.closest<HTMLElement>("[data-tray][data-lift]");
    const stage = tray ? tray.querySelector<HTMLElement>("[data-stage][data-lamp-follow]") : el.closest<HTMLElement>("[data-stage][data-lamp-follow]");
    if (!stage) return null;
    return { stage, tray };
  };

  const tick = (dt: number) => {
    if (recheck) {
      recheck = false;
      focus(document.elementFromPoint(last.x, last.y));
    }
    for (const [key, t] of targets) {
      let busy = !stepSpring(t.rx, t.goal.rx, dt);
      if (!stepSpring(t.ry, t.goal.ry, dt)) busy = true;
      if (!stepSpring(t.lift, t.goal.lift, dt)) busy = true;
      t.lx = lerpPerFrame(t.lx, t.goal.lx, MOTION_LIMITS.lampLerp, dt);
      t.ly = lerpPerFrame(t.ly, t.goal.ly, MOTION_LIMITS.lampLerp, dt);
      if (Math.abs(t.lx - t.goal.lx) > 0.002 || Math.abs(t.ly - t.goal.ly) > 0.002) busy = true;
      write(t);
      if (!busy && t !== active) {
        clear(t);
        targets.delete(key);
      }
    }
    if (targets.size === 0 || (active && targets.size === 1 && !isMoving(active))) {
      stopTick = null;
      return false;
    }
  };

  const isMoving = (t: Target) =>
    Math.abs(t.rx.value - t.goal.rx) > 0.005 ||
    Math.abs(t.ry.value - t.goal.ry) > 0.005 ||
    Math.abs(t.lift.value - t.goal.lift) > 0.005 ||
    Math.abs(t.lx - t.goal.lx) > 0.002 ||
    Math.abs(t.ly - t.goal.ly) > 0.002;

  const wake = () => {
    if (!stopTick) stopTick = addTick(tick);
  };

  const focus = (el: Element | null) => {
    const found = resolve(el);
    if (active && found?.stage === active.stage) {
      aim(active, last.x, last.y);
      wake();
      return;
    }
    if (active) {
      rest(active);
      active = null;
    }
    if (!found) {
      wake();
      return;
    }
    let t = targets.get(found.stage);
    if (!t) {
      const tilt = found.tray ? Math.min(Number(found.tray.dataset.tilt) || MOTION_LIMITS.tiltCatalog, MOTION_LIMITS.tiltHome) : 0;
      t = {
        stage: found.stage,
        tray: found.tray,
        render: found.stage.querySelector<HTMLElement>("[data-render]"),
        max: tilt,
        rx: spring(),
        ry: spring(),
        lift: spring(),
        lx: LAMP_POSE.rest.x,
        ly: LAMP_POSE.rest.y,
        goal: { rx: 0, ry: 0, lift: 0, lx: LAMP_POSE.rest.x, ly: LAMP_POSE.rest.y },
        trayRect: null,
        stageRect: found.stage.getBoundingClientRect(),
        scrollY: window.scrollY,
      };
      if (found.tray) {
        t.trayRect = found.tray.getBoundingClientRect();
        found.tray.style.transition = "box-shadow var(--dur-micro) var(--ease-instrument)";
      }
      targets.set(found.stage, t);
    }
    if (t.tray) t.stage.style.setProperty("--lamp-level", "1.25");
    active = t;
    aim(t, last.x, last.y);
    wake();
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    last = { x: event.clientX, y: event.clientY };
    focus(event.target instanceof Element ? event.target : null);
  };

  const onLeave = () => {
    if (!active) return;
    rest(active);
    active = null;
    wake();
  };

  const onScroll = () => {
    if (!active && targets.size === 0) return;
    recheck = true;
    wake();
  };

  root.addEventListener("pointermove", onPointer, { passive: true });
  root.addEventListener("pointerover", onPointer, { passive: true });
  root.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    stopTick?.();
    root.removeEventListener("pointermove", onPointer);
    root.removeEventListener("pointerover", onPointer);
    root.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    for (const t of targets.values()) clear(t);
    targets.clear();
    active = null;
  };
}
