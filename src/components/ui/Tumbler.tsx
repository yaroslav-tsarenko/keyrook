"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

const DIGIT = /[0-9]/;

export interface TumblerProps {
  value: string | number;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  animateOnChange?: boolean;
  motion?: boolean;
  live?: boolean;
  className?: string;
  slotClassName?: string;
  demo?: boolean;
  "data-demo"?: string;
}

const SIZE: Record<NonNullable<TumblerProps["size"]>, string> = {
  xs: "text-[0.75rem]",
  sm: "text-data",
  md: "text-step-1",
  lg: "text-step-3",
};

function format(value: string | number): string {
  return typeof value === "number" ? value.toLocaleString("en-GB") : value;
}

export function Tumbler({ value, label, size = "sm", animateOnChange = true, motion = false, live = false, className, slotClassName, "data-demo": demoId }: TumblerProps) {
  const text = format(value);
  const previous = useRef(text);
  const [roll, setRoll] = useState(0);

  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;
    if (animateOnChange) setRoll((r) => r + 1);
  }, [text, animateOnChange]);

  const chars = Array.from(text);
  const digitCount = chars.filter((c) => DIGIT.test(c)).length;
  let digitIndex = 0;

  return (
    <span
      data-tumbler=""
      data-tumbler-motion={motion ? "" : undefined}
      data-value={text}
      data-demo={demoId}
      role={live ? undefined : "img"}
      aria-label={live ? undefined : label ?? text}
      className={cn("inline-flex items-stretch align-middle", SIZE[size], className)}
    >
      {live ? (
        <span aria-live="polite" className="sr-only">
          {label ?? text}
        </span>
      ) : null}
      {chars.map((char, i) => {
        if (!DIGIT.test(char) && !/[A-Z]/i.test(char)) {
          return (
            <span key={`s${i}`} aria-hidden="true" className="tumbler inline-flex items-center px-[0.08em] text-ink-muted">
              {char}
            </span>
          );
        }
        const fromRight = DIGIT.test(char) ? digitCount - 1 - digitIndex++ : 0;
        const style = { "--tumbler-delay": `${fromRight * 40}ms` } as CSSProperties;
        return (
          <span key={`c${i}`} aria-hidden="true" data-slot="" className={cn("tumbler-slot", slotClassName)} style={style}>
            <span key={roll} data-glyph="" className={cn("inline-block", roll > 0 && "animate-tumbler-roll [animation-delay:var(--tumbler-delay)]")}>
              {char}
            </span>
          </span>
        );
      })}
    </span>
  );
}
