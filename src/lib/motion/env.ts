import { DESKTOP_QUERY, REDUCED_MOTION_QUERY } from "@/lib/hooks/useMediaQuery";
import { MOTION_QUERY } from "./tokens";

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

export interface MotionEnv {
  reduced: boolean;
  desktop: boolean;
  finePointer: boolean;
  coarsePointer: boolean;
  scrollTimeline: boolean;
  saveData: boolean;
  lowPower: boolean;
}

export function readMotionEnv(): MotionEnv {
  const matches = (query: string) => window.matchMedia(query).matches;
  const hints = navigator as Navigator & NavigatorHints;
  const memory = hints.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  return {
    reduced: matches(REDUCED_MOTION_QUERY),
    desktop: matches(DESKTOP_QUERY),
    finePointer: matches(MOTION_QUERY.finePointer),
    coarsePointer: matches(MOTION_QUERY.coarsePointer),
    scrollTimeline: typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()"),
    saveData: Boolean(hints.connection?.saveData),
    lowPower: memory < 4 || cores < 4,
  };
}

export function frozenTime(): number | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("t")) return null;
  return Math.max(0, Number(params.get("t")) || 0);
}

export function interactiveDesktop(env: MotionEnv): boolean {
  return !env.reduced && env.desktop && env.finePointer;
}

export function webglAllowed(env: MotionEnv): boolean {
  if (frozenTime() !== null) return !env.reduced;
  return interactiveDesktop(env) && !env.saveData && !env.lowPower;
}

export function documentTop(el: Element): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

export function onIdle(task: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 200);
  return () => window.clearTimeout(id);
}
