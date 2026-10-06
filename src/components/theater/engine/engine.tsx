"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { addTick } from "@/lib/motion/ticker";
import { frozenTime } from "@/lib/motion/env";
import { urlFor } from "../define";
import { Frame } from "../frame";
import type { AnyScene, DeviceKind, Step } from "../types";
import { presetFor, type Point, type Rect } from "./geometry";
import { createPlayer, type Player, type ScrollPlan, type StageApi } from "./runner";

type State = Record<string, unknown>;

export type EngineProps = {
  scene: AnyScene;
  device: DeviceKind;
  playing: boolean;
  loop: boolean;
  restartKey: number;
  onChapter: (index: number, text: string) => void;
  onFinish: () => void;
};

const PRESS = "button, a, label, [role='button'], [data-demo-press], [data-demo]";

function pickVisible(content: HTMLElement, selector: string) {
  const all = content.querySelectorAll<HTMLElement>(selector);
  for (const el of all) if (el.getClientRects().length > 0) return el;
  return null;
}

export default function TheaterEngine({ scene, device, playing, loop, restartKey, onChapter, onFinish }: EngineProps) {
  const [state, setState] = useState<State>(scene.initial);
  const [focus, setFocus] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const live = useRef({
    state: scene.initial as State,
    cursor: { x: 0, y: 0 } as Point,
    hovered: null as HTMLElement | null,
    pressed: null as HTMLElement | null,
  });
  const callbacks = useRef({ onChapter, onFinish });
  const playerRef = useRef<Player | null>(null);
  const playingRef = useRef(playing);
  const unsubscribe = useRef<(() => void) | null>(null);
  const controlRef = useRef<{ play: () => void; pause: () => void } | null>(null);

  useEffect(() => {
    callbacks.current = { onChapter, onFinish };
  });

  useEffect(() => {
    const L = live.current;
    const content = () => contentRef.current;
    const scale = () => {
      const c = content();
      if (!c || c.offsetWidth === 0) return 1;
      return c.getBoundingClientRect().width / c.offsetWidth;
    };
    const rectOf = (el: Element): Rect | null => {
      const c = content();
      if (!c) return null;
      const k = scale();
      const cr = c.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { left: (r.left - cr.left) / k, top: (r.top - cr.top) / k, width: r.width / k, height: r.height / k };
    };
    const find = (target: string) => {
      const c = content();
      return c ? pickVisible(c, `[data-demo="${target}"]`) : null;
    };
    const touch = device === "phone";
    const mode = (m: string) => cursorRef.current?.setAttribute("data-mode", touch ? "touch" : m);
    const commitState = (next: State) => {
      L.state = next;
      flushSync(() => setState(next));
    };
    const plan = (scroller: HTMLElement, to: number): ScrollPlan | null => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const y = Math.max(0, Math.min(max, to));
      const from = scroller.scrollTop;
      if (Math.abs(y - from) < 1) return null;
      return {
        from,
        to: y,
        apply: (v) => {
          scroller.scrollTop = v;
        },
      };
    };

    const stage: StageApi<State> = {
      getState: () => L.state,
      setState: commitState,
      restore: () => {
        L.hovered?.removeAttribute("data-hover");
        L.pressed?.removeAttribute("data-press");
        L.hovered = null;
        L.pressed = null;
        flushSync(() => setFocus(null));
        commitState(scene.initial);
        content()
          ?.querySelectorAll<HTMLElement>("[data-demo-scroll]")
          .forEach((el) => {
            el.scrollTop = 0;
          });
        spotRef.current?.removeAttribute("data-on");
        tipRef.current?.removeAttribute("data-on");
        mode("pointer");
      },
      fade: (a) => {
        const c = content();
        if (c) c.style.opacity = a >= 1 ? "" : String(a);
      },
      locate: (target) => {
        const el = find(target);
        return el ? rectOf(el) : null;
      },
      autoScroll: (target) => {
        const el = find(target);
        const scroller = el?.closest<HTMLElement>("[data-demo-scroll]");
        if (!el || !scroller) return null;
        const sr = rectOf(scroller);
        const er = rectOf(el);
        if (!sr || !er) return null;
        if (er.top >= sr.top + 8 && er.top + er.height <= sr.top + sr.height - 8) return null;
        return plan(scroller, scroller.scrollTop + (er.top - sr.top) - sr.height * 0.3);
      },
      scrollPlan: (container, to) => {
        const c = content();
        const scroller = c?.querySelector<HTMLElement>(`[data-demo-scroll="${container}"]`);
        if (!scroller) return null;
        if (typeof to === "number") return plan(scroller, to);
        const el = find(to);
        const sr = rectOf(scroller);
        const er = el ? rectOf(el) : null;
        if (!sr || !er) return null;
        return plan(scroller, scroller.scrollTop + (er.top - sr.top) - 16);
      },
      home: () => {
        const c = content();
        return c ? { x: c.clientWidth * 0.78, y: c.clientHeight * 0.84 } : { x: 0, y: 0 };
      },
      getCursor: () => L.cursor,
      setCursor: (p) => {
        L.cursor = p;
        const el = cursorRef.current;
        if (el) el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      },
      cursorVisible: (on) => {
        const el = cursorRef.current;
        if (!el) return;
        if (on) el.setAttribute("data-on", "");
        else el.removeAttribute("data-on");
      },
      cursorMode: (m) => mode(m),
      hover: (target) => {
        L.hovered?.removeAttribute("data-hover");
        L.hovered = null;
        if (!target || touch) return;
        const el = find(target)?.closest<HTMLElement>(PRESS) ?? null;
        el?.setAttribute("data-hover", "");
        L.hovered = el;
      },
      press: (target) => {
        cursorRef.current?.setAttribute("data-down", "");
        const ring = ringRef.current;
        if (ring) {
          ring.removeAttribute("data-pulse");
          void ring.offsetWidth;
          ring.setAttribute("data-pulse", "");
        }
        const el = find(target);
        if (!el) return;
        const pressable = el.closest<HTMLElement>(PRESS) ?? el;
        if (pressable.getBoundingClientRect().width < 420 * scale()) {
          pressable.setAttribute("data-press", "");
          L.pressed = pressable;
        }
      },
      release: () => {
        cursorRef.current?.removeAttribute("data-down");
        L.pressed?.removeAttribute("data-press");
        L.pressed = null;
      },
      focus: (target) => flushSync(() => setFocus(target)),
      highlight: (target, label) => {
        const spot = spotRef.current;
        const tip = tipRef.current;
        const c = content();
        if (!spot || !tip || !c) return;
        const el = target ? find(target) : null;
        const r = el ? rectOf(el) : null;
        if (!r) {
          spot.removeAttribute("data-on");
          tip.removeAttribute("data-on");
          return;
        }
        const pad = 6;
        spot.style.left = `${r.left - pad}px`;
        spot.style.top = `${r.top - pad}px`;
        spot.style.width = `${r.width + pad * 2}px`;
        spot.style.height = `${r.height + pad * 2}px`;
        const text = tip.querySelector<HTMLElement>("[data-tip-text]");
        if (text) text.textContent = label ?? "";
        const width = Math.min(300, c.clientWidth - 24);
        const below = r.top + r.height + pad + 96 < c.clientHeight;
        tip.style.left = `${Math.max(12, Math.min(c.clientWidth - width - 12, r.left))}px`;
        tip.style.maxWidth = `${width}px`;
        tip.style.top = below ? `${r.top + r.height + pad + 10}px` : "";
        tip.style.bottom = below ? "" : `${c.clientHeight - r.top + pad + 10}px`;
        spot.setAttribute("data-on", "");
        tip.setAttribute("data-on", "");
      },
    };

    const player = createPlayer<State>({
      steps: scene.steps as Step<State>[],
      stage,
      loop,
      onChapter: (i, text) => callbacks.current.onChapter(i, text),
      onFinish: () => callbacks.current.onFinish(),
    });
    playerRef.current = player;

    const frozen = frozenTime();
    if (frozen !== null) {
      player.seek(frozen);
      return () => {
        playerRef.current = null;
      };
    }

    const subscribe = () => {
      if (unsubscribe.current) return;
      unsubscribe.current = addTick((dt) => {
        player.tick(dt);
        if (!player.playing) {
          unsubscribe.current = null;
          return false;
        }
      });
    };
    const control = {
      play: () => {
        player.play();
        subscribe();
      },
      pause: () => {
        player.pause();
        unsubscribe.current?.();
        unsubscribe.current = null;
      },
    };
    controlRef.current = control;
    if (playingRef.current) control.play();
    return () => {
      control.pause();
      controlRef.current = null;
      playerRef.current = null;
    };
  }, [scene, device, loop]);

  useEffect(() => {
    playingRef.current = playing;
    const control = controlRef.current;
    if (!control) return;
    if (playing) control.play();
    else control.pause();
  }, [playing]);

  const lastRestart = useRef(restartKey);
  useEffect(() => {
    if (lastRestart.current === restartKey) return;
    lastRestart.current = restartKey;
    const player = playerRef.current;
    if (!player) return;
    player.restart();
    controlRef.current?.play();
  }, [restartKey]);

  const View = scene.View;

  return (
    <Frame
      device={device}
      address={urlFor(scene, state)}
      vars={presetFor(device)}
      contentRef={contentRef}
      overlay={
        <>
          <div ref={spotRef} className="th-spot" />
          <div ref={tipRef} className="th-tip">
            <span className="eyebrow block text-ink-muted">Note</span>
            <span data-tip-text="" className="mt-1 block" />
          </div>
          <div ref={cursorRef} className="th-cursor" data-mode={device === "phone" ? "touch" : "pointer"}>
            <span ref={ringRef} className="th-ring" />
            <svg data-shape="pointer" width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
              <path d="M2 2v19l5-4.6 3.6 7.6 3.4-1.5-3.6-7.5H17z" className="th-cursor-fill" strokeWidth="1.25" strokeLinejoin="miter" />
            </svg>
            <span data-shape="text" />
            <span data-shape="touch" />
          </div>
        </>
      }
    >
      <View s={state} device={device} focus={focus} />
    </Frame>
  );
}
