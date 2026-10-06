import { readMotionEnv, type MotionEnv } from "./env";
import { mountHero } from "./scenes/hero";
import { mountInspect } from "./scenes/inspect";
import { mountReveal } from "./scenes/reveal";
import { mountTrays } from "./scenes/trays";

interface Scene {
  selector: string;
  mount: (el: HTMLElement, env: MotionEnv) => () => void;
}

const SCENES: Scene[] = [
  { selector: "[data-scene=bay-hero]", mount: mountHero },
  { selector: "[data-scene=inspect]", mount: mountInspect },
  { selector: "[data-scene=bays], [data-scene=rarity-ladder], [data-scene=marks]", mount: mountReveal },
];

const yieldToMain = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export function mountMotion(root: Document): () => void {
  const env = readMotionEnv();
  const cleanups: (() => void)[] = [];
  let cancelled = false;
  if (env.reduced) return () => {};

  cleanups.push(mountTrays(root, env));

  (async () => {
    for (const scene of SCENES) {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(scene.selector));
      if (nodes.length === 0) continue;
      await yieldToMain();
      if (cancelled) return;
      for (const node of nodes) cleanups.push(scene.mount(node, env));
    }
  })();

  return () => {
    cancelled = true;
    for (const cleanup of cleanups.reverse()) cleanup();
    cleanups.length = 0;
  };
}
