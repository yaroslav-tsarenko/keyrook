import { erase } from "../define";
import type { AnyScene, SceneId } from "../types";

export const sceneLoaders: Record<SceneId, () => Promise<AnyScene>> = {
  pick: () => import("./pick").then((m) => erase(m.pick)),
  pay: () => import("./pay").then((m) => erase(m.pay)),
  decrypt: () => import("./decrypt").then((m) => erase(m.decrypt)),
  redeem: () => import("./redeem").then((m) => erase(m.redeem)),
  support: () => import("./support").then((m) => erase(m.support)),
};
