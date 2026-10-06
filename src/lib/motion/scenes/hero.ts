import { addTick, clamp, cubicBezier, lerpPerFrame, spring, stepSpring } from "../ticker";
import { documentTop, frozenTime, interactiveDesktop, onIdle, webglAllowed, type MotionEnv } from "../env";
import { LAMP_POSE, MOTION_DEPTH, MOTION_DURATION, MOTION_EASE, MOTION_LIMITS } from "../tokens";
import type { LampLayer } from "./lamp-gl";

const easeInOut = cubicBezier(...MOTION_EASE.inOut);

function smooth(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function mountHero(section: HTMLElement, env: MotionEnv): () => void {
  const tray = section.querySelector<HTMLElement>("[data-tray]");
  const stage = tray?.querySelector<HTMLElement>("[data-stage]");
  const render = stage?.querySelector<HTMLElement>("[data-render]") ?? null;
  const readout = section.querySelector<HTMLElement>("[data-hero-readout]");
  const pin = section.querySelector<HTMLElement>("[data-hero-pin]");
  const frozen = frozenTime();
  if (!tray || !stage) return () => {};
  if (!interactiveDesktop(env) && !(frozen !== null && env.desktop && !env.reduced)) return () => {};

  const cleanups: (() => void)[] = [];
  const pointer = { x: 0, y: 0, cx: 0, cy: 0, seen: false };
  const offset = { x: 0, y: 0 };
  const lamp: { x: number; y: number } = { x: LAMP_POSE.rest.x, y: LAMP_POSE.rest.y };
  const tiltX = spring();
  const tiltY = spring();
  let layer: LampLayer | null = null;
  let visible = true;
  let stopTick: (() => void) | null = null;
  let sweepStart = -1;
  let sweepPending = true;
  let sectionTop = 0;
  let range = 0;

  tray.style.transition = "none";

  const measure = () => {
    sectionTop = documentTop(section);
    range = pin ? Math.max(0, section.offsetHeight - pin.offsetHeight) : 0;
  };
  measure();

  const progress = () => (range > 0 ? clamp((window.scrollY - sectionTop) / range, 0, 1) : 0);

  const sweepAt = (elapsed: number) => {
    const t = clamp(elapsed / MOTION_DURATION.lampSweep, 0, 1);
    const e = easeInOut(t);
    lamp.x = LAMP_POSE.sweepFrom.x + (LAMP_POSE.sweepTo.x - LAMP_POSE.sweepFrom.x) * e;
    lamp.y = LAMP_POSE.sweepFrom.y + (LAMP_POSE.sweepTo.y - LAMP_POSE.sweepFrom.y) * e;
    return t >= 1;
  };

  const write = () => {
    stage.style.setProperty("--lx", `${(lamp.x * 100).toFixed(2)}%`);
    stage.style.setProperty("--ly", `${(lamp.y * 100).toFixed(2)}%`);
    tray.style.transform = `perspective(${MOTION_LIMITS.perspectiveHero}px) rotateX(${tiltX.value.toFixed(3)}deg) rotateY(${tiltY.value.toFixed(3)}deg)`;
    tray.style.translate = `${(-offset.x * MOTION_DEPTH[2].pointer).toFixed(2)}px ${(-offset.y * MOTION_DEPTH[2].pointer).toFixed(2)}px`;
    const inside = MOTION_DEPTH[3].pointer - MOTION_DEPTH[2].pointer;
    if (render) render.style.translate = `${(-offset.x * inside).toFixed(2)}px ${(-offset.y * inside).toFixed(2)}px`;
    if (readout) readout.style.translate = `${(-offset.x * MOTION_DEPTH[4].pointer).toFixed(2)}px ${(-offset.y * MOTION_DEPTH[4].pointer).toFixed(2)}px`;
    layer?.draw({ lx: lamp.x, ly: lamp.y, yaw: tiltY.value, pitch: tiltX.value, level: 1 });
  };

  const tick = (dt: number, now: number) => {
    if (!visible) {
      stopTick = null;
      return false;
    }
    const settle = smooth(progress() / MOTION_LIMITS.heroSettleUntil);
    const freedom = 1 - settle;
    let busy = false;

    if (sweepStart >= 0) {
      if (pointer.seen || sweepAt(now - sweepStart)) sweepStart = -1;
      busy = true;
    } else {
      const rect = stage.getBoundingClientRect();
      const followX = pointer.seen ? clamp((pointer.cx - rect.left) / Math.max(1, rect.width), -0.2, 1.2) : LAMP_POSE.rest.x;
      const followY = pointer.seen ? clamp((pointer.cy - rect.top) / Math.max(1, rect.height), -0.2, 1.1) : LAMP_POSE.rest.y;
      const targetX = followX * freedom + LAMP_POSE.rake.x * settle;
      const targetY = followY * freedom + LAMP_POSE.rake.y * settle;
      lamp.x = lerpPerFrame(lamp.x, targetX, MOTION_LIMITS.lampLerp, dt);
      lamp.y = lerpPerFrame(lamp.y, targetY, MOTION_LIMITS.lampLerp, dt);
      if (Math.abs(lamp.x - targetX) > 0.001 || Math.abs(lamp.y - targetY) > 0.001) busy = true;
    }

    offset.x = lerpPerFrame(offset.x, pointer.x * freedom, MOTION_LIMITS.lampLerp, dt);
    offset.y = lerpPerFrame(offset.y, pointer.y * freedom, MOTION_LIMITS.lampLerp, dt);
    if (Math.abs(offset.x - pointer.x * freedom) > 0.001 || Math.abs(offset.y - pointer.y * freedom) > 0.001) busy = true;

    const max = Number(tray.dataset.tilt) || MOTION_LIMITS.tiltHome;
    const limit = Math.min(max, MOTION_LIMITS.tiltHome);
    if (!stepSpring(tiltY, pointer.x * limit * freedom, dt)) busy = true;
    if (!stepSpring(tiltX, -pointer.y * limit * freedom, dt)) busy = true;

    write();
    if (!busy) {
      stopTick = null;
      return false;
    }
  };

  const wake = () => {
    if (!stopTick && visible && frozen === null) stopTick = addTick(tick);
  };

  const startSweep = () => {
    if (!sweepPending) return;
    sweepPending = false;
    if (pointer.seen) return;
    sweepStart = performance.now();
    wake();
  };

  if (frozen !== null) {
    sweepAt(frozen * 1000);
    write();
  } else {
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = tray.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      pointer.x = clamp((event.clientX - cx) / (window.innerWidth / 2), -1, 1);
      pointer.y = clamp((event.clientY - cy) / (window.innerHeight / 2), -1, 1);
      pointer.cx = event.clientX;
      pointer.cy = event.clientY;
      pointer.seen = true;
      wake();
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
      pointer.seen = false;
      wake();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", wake, { passive: true });
    cleanups.push(() => {
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", wake);
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(section);
    const resize = new ResizeObserver(() => {
      measure();
      wake();
    });
    resize.observe(section);
    cleanups.push(() => {
      io.disconnect();
      resize.disconnect();
    });

    const fallback = window.setTimeout(startSweep, 1200);
    cleanups.push(() => window.clearTimeout(fallback));
  }

  if (render && webglAllowed(env)) {
    let disposed = false;
    const cancelIdle = onIdle(() => {
      import("./lamp-gl")
        .then(({ createLampLayer }) =>
          createLampLayer(stage, {
            forced: frozen !== null,
            onInvalidate: () => (frozen === null ? wake() : layer?.draw({ lx: lamp.x, ly: lamp.y, yaw: 0, pitch: 0, level: 1 })),
            onLost: () => {
              layer = null;
            },
          }),
        )
        .then((created) => {
          if (disposed) {
            created?.dispose();
            return;
          }
          layer = created;
          if (frozen !== null) write();
          else startSweep();
        }, startSweep);
    }, 1500);
    cleanups.push(() => {
      disposed = true;
      cancelIdle();
      layer?.dispose();
      layer = null;
    });
  }

  return () => {
    stopTick?.();
    for (const cleanup of cleanups.reverse()) cleanup();
    for (const prop of ["--lx", "--ly"]) stage.style.removeProperty(prop);
    tray.style.transform = "";
    tray.style.translate = "";
    tray.style.transition = "";
    if (render) render.style.translate = "";
    if (readout) readout.style.translate = "";
  };
}
