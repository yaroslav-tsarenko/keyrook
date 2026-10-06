"use client";

import "@/styles/theater.css";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { resolveEnd } from "./define";
import { sceneLoaders } from "./scenes/loaders";
import { Poster, Still } from "./still";
import type { AnyScene, SceneId, TheaterDevice } from "./types";

export function MiniStill({
  scene: id,
  state,
  device = "desktop",
  address,
  label,
  className,
}: {
  scene: SceneId;
  state?: Record<string, unknown>;
  device?: TheaterDevice;
  address: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<AnyScene | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void sceneLoaders[id]().then((s) => alive && setScene(s));
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [id]);

  return (
    <div ref={ref} role={label ? "img" : undefined} aria-label={label} className={cn("th-mini", className)}>
      <div aria-hidden="true" inert className="th-box pointer-events-none select-none" data-box={device}>
        {scene ? <Still scene={scene} device={device} state={{ ...resolveEnd(scene), ...state }} /> : <Poster device={device} address={{ label: address }} />}
      </div>
    </div>
  );
}
