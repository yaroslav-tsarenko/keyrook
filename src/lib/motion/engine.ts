import { readMotionEnv, type MotionEnv } from "./env";
import { mountVaultDoor } from "./door/controller";
import { mountDepth } from "./scenes/depth";
import { mountDoorAjar } from "./scenes/door-ajar";
import { mountIndexSlide } from "./scenes/index-slide";
import { mountLedger } from "./scenes/ledger";
import { mountPlates } from "./scenes/plate";
import { mountReleasePin } from "./scenes/releases";
import { mountReveal } from "./scenes/reveal";
import { mountTumblers } from "./scenes/tumblers";

interface Scene {
  selector: string;
  mount: (el: HTMLElement, env: MotionEnv) => () => void;
  reduced?: boolean;
}

interface PageScene {
  mount: (root: Document, env: MotionEnv) => () => void;
}

const SCENES: Scene[] = [
  { selector: "[data-vault-door], [data-vault-canvas]", mount: mountVaultDoor, reduced: true },
  { selector: "[data-scene=reveal], [data-scene=lockers]", mount: mountReveal },
  { selector: "[data-scene=ledger]", mount: mountLedger, reduced: true },
  { selector: "[data-pin=releases]", mount: mountReleasePin },
  { selector: "[data-scene=door-ajar]", mount: mountDoorAjar },
];

const PAGE_SCENES: PageScene[] = [{ mount: mountTumblers }, { mount: mountPlates }, { mount: mountDepth }, { mount: mountIndexSlide }];

const yieldToMain = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export function mountMotion(root: Document): () => void {
  const env = readMotionEnv();
  const cleanups: (() => void)[] = [];
  let cancelled = false;

  (async () => {
    for (const scene of SCENES) {
      if (env.reduced && !scene.reduced) continue;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(scene.selector));
      if (nodes.length === 0) continue;
      await yieldToMain();
      if (cancelled) return;
      for (const node of nodes) cleanups.push(scene.mount(node, env));
    }
    if (env.reduced) return;
    for (const scene of PAGE_SCENES) {
      await yieldToMain();
      if (cancelled) return;
      cleanups.push(scene.mount(root, env));
    }
  })();

  return () => {
    cancelled = true;
    for (const cleanup of cleanups.reverse()) cleanup();
    cleanups.length = 0;
  };
}
