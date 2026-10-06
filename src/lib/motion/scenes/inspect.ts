import { addTick, clamp, lerpPerFrame, spring, stepSpring } from "../ticker";
import { frozenTime, interactiveDesktop, onIdle, webglAllowed, type MotionEnv } from "../env";
import { LAMP_POSE, MOTION_LIMITS } from "../tokens";
import type { LampLayer } from "./lamp-gl";

const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

function axisAngle(pitch: number, yaw: number): string {
  const angle = Math.hypot(pitch, yaw);
  if (angle < 0.01) return "none";
  return `${(pitch / angle).toFixed(4)} ${(yaw / angle).toFixed(4)} 0 ${angle.toFixed(3)}deg`;
}

export function mountInspect(scene: HTMLElement, env: MotionEnv): () => void {
  const stage = scene.querySelector<HTMLElement>("[data-stage]");
  const render = stage?.querySelector<HTMLElement>("[data-render]") ?? null;
  const frozen = frozenTime();
  if (!stage || !render) return () => {};
  if (!interactiveDesktop(env) && !(frozen !== null && env.desktop && !env.reduced)) return () => {};

  const cleanups: (() => void)[] = [];
  const yaw = spring();
  const pitch = spring();
  const target = { yaw: 0, pitch: 0 };
  const lamp: { x: number; y: number } = { x: LAMP_POSE.rest.x, y: LAMP_POSE.rest.y };
  const lampTarget: { x: number; y: number } = { x: LAMP_POSE.rest.x, y: LAMP_POSE.rest.y };
  const drag = { id: -1, x: 0, y: 0, yaw: 0, pitch: 0 };
  let layer: LampLayer | null = null;
  let visible = true;
  let stopTick: (() => void) | null = null;
  let lastView = scene.dataset.view ?? "";

  stage.style.perspective = `${MOTION_LIMITS.perspectiveInspect}px`;

  const rotating = () => scene.dataset.rotate === "on";

  const write = () => {
    stage.style.setProperty("--lx", `${(lamp.x * 100).toFixed(2)}%`);
    stage.style.setProperty("--ly", `${(lamp.y * 100).toFixed(2)}%`);
    render.style.rotate = axisAngle(pitch.value, yaw.value);
    layer?.draw({ lx: lamp.x, ly: lamp.y, yaw: yaw.value, pitch: pitch.value, level: 1 });
  };

  const tick = (dt: number) => {
    if (!visible) {
      stopTick = null;
      return false;
    }
    let busy = !stepSpring(yaw, target.yaw, dt);
    if (!stepSpring(pitch, target.pitch, dt)) busy = true;
    lamp.x = lerpPerFrame(lamp.x, lampTarget.x, MOTION_LIMITS.lampLerp, dt);
    lamp.y = lerpPerFrame(lamp.y, lampTarget.y, MOTION_LIMITS.lampLerp, dt);
    if (Math.abs(lamp.x - lampTarget.x) > 0.001 || Math.abs(lamp.y - lampTarget.y) > 0.001) busy = true;
    write();
    if (!busy) {
      stopTick = null;
      return false;
    }
  };

  const wake = () => {
    if (!stopTick && visible && frozen === null) stopTick = addTick(tick);
  };

  const setTarget = (nextYaw: number, nextPitch: number) => {
    target.yaw = clamp(nextYaw, -MOTION_LIMITS.tiltInspectYaw, MOTION_LIMITS.tiltInspectYaw);
    target.pitch = clamp(nextPitch, -MOTION_LIMITS.tiltInspectPitch, MOTION_LIMITS.tiltInspectPitch);
    wake();
  };

  const syncCursor = () => {
    stage.style.cursor = rotating() ? (drag.id >= 0 ? "grabbing" : "grab") : "";
  };

  if (frozen === null) {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (drag.id === event.pointerId) {
        setTarget(drag.yaw + (event.clientX - drag.x) * MOTION_LIMITS.inspectDragYaw, drag.pitch - (event.clientY - drag.y) * MOTION_LIMITS.inspectDragPitch);
      }
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      const near = x > -0.15 && x < 1.15 && y > -0.15 && y < 1.15;
      lampTarget.x = near ? clamp(x, -0.1, 1.1) : LAMP_POSE.rest.x;
      lampTarget.y = near ? clamp(y, -0.1, 1.05) : LAMP_POSE.rest.y;
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (!rotating() || event.button !== 0 || event.pointerType !== "mouse") return;
      if (event.target instanceof Element && event.target.closest("button, a")) return;
      event.preventDefault();
      drag.id = event.pointerId;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.yaw = target.yaw;
      drag.pitch = target.pitch;
      stage.setPointerCapture(event.pointerId);
      syncCursor();
    };

    const onUp = (event: PointerEvent) => {
      if (drag.id !== event.pointerId) return;
      drag.id = -1;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      syncCursor();
    };

    const onKey = (event: KeyboardEvent) => {
      const step = KEYS[event.key];
      if (!step || !rotating() || event.target !== scene) return;
      event.preventDefault();
      setTarget(target.yaw + step[0] * MOTION_LIMITS.inspectKeyStep, target.pitch + step[1] * MOTION_LIMITS.inspectKeyStep);
    };

    const observer = new MutationObserver(() => {
      const view = scene.dataset.view ?? "";
      if (view !== lastView) {
        lastView = view;
        setTarget(0, 0);
      }
      if (!rotating()) drag.id = -1;
      syncCursor();
    });
    observer.observe(scene, { attributes: true, attributeFilter: ["data-rotate", "data-view"] });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(scene);

    window.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    scene.addEventListener("keydown", onKey);
    syncCursor();
    cleanups.push(() => {
      observer.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      scene.removeEventListener("keydown", onKey);
    });
  }

  if (webglAllowed(env)) {
    let disposed = false;
    const cancelIdle = onIdle(() => {
      import("./lamp-gl")
        .then(({ createLampLayer }) =>
          createLampLayer(stage, {
            forced: frozen !== null,
            onInvalidate: () => (frozen === null ? wake() : write()),
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
          if (frozen !== null) {
            lamp.x = LAMP_POSE.rake.x + (LAMP_POSE.rest.x - LAMP_POSE.rake.x) * Math.min(1, frozen / 2);
            lamp.y = LAMP_POSE.rake.y;
          }
          write();
        });
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
    stage.style.perspective = "";
    stage.style.cursor = "";
    stage.style.removeProperty("--lx");
    stage.style.removeProperty("--ly");
    render.style.rotate = "";
  };
}
