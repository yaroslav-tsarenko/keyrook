import copy from "../../../../messages/en/theater.json";
import { STORE_POLICY } from "@/config/store-policy";
import { ACTIVATION } from "@/config/activation";
import type { DeviceKind, SceneId } from "../types";

export type SceneCopy = (typeof copy.scenes)[SceneId];

export interface SceneMeta {
  id: SceneId;
  label: string;
  title: string;
  summary: string;
  url: string;
  captions: string[];
  device: DeviceKind;
}

export const THEATER_COPY = copy;

export const SCENE_ORDER: SceneId[] = ["pick", "pay", "decrypt", "redeem", "support"];

export function sceneEnabled(id: SceneId): boolean {
  if (id === "pay") return STORE_POLICY.payment.hostedPage && STORE_POLICY.payment.threeDSecure;
  if (id === "support") return STORE_POLICY.guarantee.faultyKey;
  return true;
}

export function fillCopy(text: string, platform: keyof typeof ACTIVATION = "steam"): string {
  const guide = ACTIVATION[platform];
  return text
    .replaceAll("{replyTime}", STORE_POLICY.support.replyTime)
    .replaceAll("{name}", guide.name)
    .replaceAll("{path}", guide.menuPath.join(", then "));
}

export function sceneMeta(id: SceneId): SceneMeta {
  const c = copy.scenes[id];
  return {
    id,
    label: c.label,
    title: c.title,
    summary: fillCopy(c.summary),
    url: fillCopy(c.url),
    captions: c.captions.map((t) => fillCopy(t)),
    device: "desktop",
  };
}

export function enabledScenes(): SceneMeta[] {
  return SCENE_ORDER.filter(sceneEnabled).map(sceneMeta);
}
