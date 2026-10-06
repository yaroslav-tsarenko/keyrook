"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils/cn";
import { frozenTime } from "@/lib/motion/env";
import { resolveEnd } from "./define";
import type { EngineProps } from "./engine/engine";
import { afterLoadIdle, onFirstInteraction } from "./idle";
import { sceneLoaders } from "./scenes/loaders";
import { Still, type BoxKind } from "./still";
import { useTheaterSync } from "./sync";
import type { AnyScene, DeviceKind, SceneId, TheaterDevice } from "./types";

type Entry = { ratio: number; exclusive: boolean; set: (on: boolean) => void };

const registry = new Map<number, Entry>();
let nextId = 0;

function elect() {
  let best: Entry | null = null;
  for (const e of registry.values()) if (e.exclusive && e.ratio >= 0.2 && (!best || e.ratio > best.ratio)) best = e;
  for (const e of registry.values()) e.set(!e.exclusive || e === best);
}

let enginePromise: Promise<ComponentType<EngineProps>> | null = null;
const loadEngine = () => (enginePromise ??= import("./engine/engine").then((m) => m.default));

function resolveDevice(device: TheaterDevice): DeviceKind {
  if (device !== "auto") return device;
  return window.matchMedia("(min-width: 840px)").matches ? "desktop" : "phone";
}

export type StageLabels = { play: string; pause: string; replay: string; sample: string; illustration: string };

export type TheaterStageProps = {
  sceneId: SceneId;
  device: TheaterDevice;
  box: BoxKind;
  title: string;
  captions: string[];
  labels: StageLabels;
  poster?: ReactNode;
  autoPlay?: boolean;
  loop?: boolean;
  external?: boolean;
  exclusive?: boolean;
  eager?: boolean;
  onFinish?: () => void;
  onReduced?: (reduced: boolean) => void;
  className?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TheaterStage({
  sceneId,
  device,
  box,
  title,
  captions,
  labels,
  poster,
  autoPlay = true,
  loop = true,
  external = false,
  exclusive = true,
  eager = false,
  onFinish,
  onReduced,
  className,
}: TheaterStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const sync = useTheaterSync();
  const [near, setNear] = useState(eager);
  const [ratio, setRatio] = useState(0);
  const [elected, setElected] = useState(!exclusive);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [scene, setScene] = useState<AnyScene | null>(null);
  const [Engine, setEngine] = useState<ComponentType<EngineProps> | null>(null);
  const [resolved, setResolved] = useState<DeviceKind>("desktop");
  const [userPaused, setUserPaused] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const [finished, setFinished] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [restartKey, setRestartKey] = useState(0);
  const setSyncChapter = sync?.setChapter;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => {
      setReduced(mq.matches);
      onReduced?.(mq.matches);
    };
    onMq();
    mq.addEventListener("change", onMq);
    const onVis = () => setHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    const onFrozen = () => {
      if (frozenTime() !== null) setNear(true);
    };
    onFrozen();
    const watch = (rootMargin: string) =>
      new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          setNear(true);
          inView.disconnect();
          nearby.disconnect();
        },
        { rootMargin },
      );
    const inView = watch("0px");
    const nearby = watch("300px 0px");
    const cancelIdle = afterLoadIdle(() => inView.observe(el), 1500);
    const cancelInteraction = onFirstInteraction(() => nearby.observe(el));
    const id = nextId++;
    const entry: Entry = { ratio: 0, exclusive, set: (on) => setElected(on) };
    registry.set(id, entry);
    const viewObs = new IntersectionObserver(
      (entries) => {
        const r = entries[entries.length - 1]?.intersectionRatio ?? 0;
        entry.ratio = r;
        setRatio(r);
        elect();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    viewObs.observe(el);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      cancelIdle();
      cancelInteraction();
      inView.disconnect();
      nearby.disconnect();
      viewObs.disconnect();
      registry.delete(id);
      elect();
    };
  }, [exclusive, onReduced]);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    const tasks: Promise<unknown>[] = [sceneLoaders[sceneId]()];
    if (!reduced) tasks.push(loadEngine());
    Promise.all(tasks)
      .then(([s, E]) => {
        if (cancelled) return;
        setResolved(resolveDevice(device));
        setScene(s as AnyScene);
        if (E) setEngine(() => E as ComponentType<EngineProps>);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [near, reduced, sceneId, device]);

  useEffect(() => {
    if (device !== "auto") return;
    const mq = window.matchMedia("(min-width: 840px)");
    const on = () => setResolved(mq.matches ? "desktop" : "phone");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [device]);

  const onChapter = useCallback(
    (i: number) => {
      setChapter(i);
      setSyncChapter?.(i);
    },
    [setSyncChapter],
  );

  const handleFinish = useCallback(() => {
    setFinished(true);
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    if (reduced) setSyncChapter?.(-1);
  }, [reduced, setSyncChapter]);

  const live = Boolean(Engine && scene && !reduced);
  const inView = ratio > 0.05;
  const frozen = typeof window !== "undefined" && frozenTime() !== null;
  const playing = live && started && !userPaused && !finished && (frozen || (inView && elected && !hidden));

  const toggle = () => {
    if (finished) {
      setFinished(false);
      setUserPaused(false);
      setRestartKey((k) => k + 1);
      return;
    }
    if (!started) {
      setStarted(true);
      setUserPaused(false);
      return;
    }
    setUserPaused((p) => !p);
  };

  let content: ReactNode = poster ?? null;
  if (scene && reduced) {
    content = <Still scene={scene} device={resolved} state={resolveEnd(scene)} />;
  } else if (scene && Engine) {
    content = <Engine scene={scene} device={resolved} playing={playing} loop={loop} restartKey={restartKey} onChapter={onChapter} onFinish={handleFinish} />;
  } else if (scene) {
    content = <Still scene={scene} device={resolved} state={scene.initial} />;
  }

  const paused = !playing;
  const label = finished ? labels.replay : paused && (userPaused || !started) ? labels.play : labels.pause;
  const KnobIcon = finished ? RotateCcw : label === labels.play ? Play : Pause;
  const shown = reduced ? -1 : chapter;

  return (
    <figure ref={rootRef} className={cn("th-root m-0", className)} data-paused={paused || undefined} data-scene-id={sceneId} aria-label={title}>
      <div className="th-box" data-box={box} aria-hidden="true" inert>
        {content}
      </div>
      <div className="mt-4 flex min-h-11 items-center gap-4">
        {!reduced && captions.length > 0 ? (
          <span aria-hidden="true" className="inline-flex shrink-0 items-center text-[0.8125rem]">
            <span className="tumbler-slot">{pad(Math.max(1, shown + 1))[0]}</span>
            <span className="tumbler-slot">{pad(Math.max(1, shown + 1))[1]}</span>
            <span className="px-1 font-mono text-ink-muted">/</span>
            <span className="tumbler-slot">{pad(captions.length)[0]}</span>
            <span className="tumbler-slot">{pad(captions.length)[1]}</span>
          </span>
        ) : null}
        <p aria-hidden="true" className="m-0 min-w-0 flex-1 truncate text-step-0 text-ink">
          <span key={shown} className="motion-safe:animate-fade-in">
            {reduced ? title : (captions[Math.max(0, shown)] ?? title)}
          </span>
        </p>
        <Plate variant="neutral" size="sm" className="max-[839px]:hidden">
          {labels.sample}
        </Plate>
        {!reduced ? (
          <button type="button" onClick={toggle} aria-label={label} title={label} className="th-knob">
            <KnobIcon size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <figcaption className="sr-only">
        {title} {labels.illustration}
      </figcaption>
      {!external ? (
        <ol className={cn(reduced ? "m-0 mt-4 flex list-none flex-col gap-2 border-t border-line p-0 pt-4" : "sr-only")}>
          {captions.map((c, i) => (
            <li key={c} className="flex gap-3 text-ui-md text-ink">
              <span aria-hidden="true" className="tumbler-slot text-[0.75rem]">
                {i + 1}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </figure>
  );
}
