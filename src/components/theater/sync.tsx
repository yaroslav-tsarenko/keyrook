"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Lamp } from "@/components/ui/Lamp";
import { cn } from "@/lib/utils/cn";

type SyncValue = { chapter: number; setChapter: (i: number) => void; scene: string | null; setScene: (id: string | null) => void };

const SyncContext = createContext<SyncValue | null>(null);

export function TheaterSync({ children }: { children: ReactNode }) {
  const [chapter, setChapter] = useState(-1);
  const [scene, setScene] = useState<string | null>(null);
  const value = useMemo(() => ({ chapter, setChapter, scene, setScene }), [chapter, scene]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useTheaterSync() {
  return useContext(SyncContext);
}

export function TheaterSteps({ steps, className, reduced = false }: { steps: string[]; className?: string; reduced?: boolean }) {
  const sync = useTheaterSync();
  const active = reduced ? -1 : (sync?.chapter ?? -1);
  return (
    <ol data-theater-steps="" className={cn("m-0 flex list-none flex-col border-t border-line p-0", className)}>
      {steps.map((text, i) => {
        const done = active > i;
        const on = active === i;
        return (
          <li key={text} aria-current={on ? "step" : undefined} className={cn("flex items-start gap-3 border-b border-line py-3 transition-colors duration-[180ms]", on ? "text-ink" : done ? "text-ink-muted" : "text-ink-muted")}>
            <span aria-hidden="true" className="tumbler-slot mt-px shrink-0 text-[0.8125rem]">
              {done ? <Check size={14} className="text-ink" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1 text-ui-md leading-[1.45]">
              <span className="sr-only">Step {i + 1}: </span>
              {text}
            </span>
            <Lamp on={on} className={cn("mt-1.5", on ? "" : "invisible")} />
          </li>
        );
      })}
    </ol>
  );
}

export function ActiveSceneSteps({ scenes, className }: { scenes: { id: string; captions: string[] }[]; className?: string }) {
  const sync = useTheaterSync();
  const current = scenes.find((s) => s.id === sync?.scene) ?? scenes[0];
  if (!current) return null;
  return <TheaterSteps key={current.id} steps={current.captions} className={className} />;
}
