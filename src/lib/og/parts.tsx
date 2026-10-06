import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { WORDMARK } from "@/lib/brand-mark";
import { OG_PALETTE as P, OG_SIZE, ogFonts } from "./assets";

export async function ogResponse(element: ReactElement, cacheSeconds = 86400) {
  const fonts = await ogFonts();
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts,
    headers: { "Cache-Control": `public, max-age=${Math.min(cacheSeconds, 3600)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}` },
  });
}

export function Wordmark({ size, color = P.ink }: { size: number; color?: string }) {
  const width = (WORDMARK.width / WORDMARK.height) * size;
  const i = WORDMARK.index;
  return (
    <svg width={width} height={size} viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}>
      <path d={WORDMARK.letters} fill={color} />
      <path d={WORDMARK.dial} fill={color} />
      <path d={WORDMARK.ticks} fill={P.room} />
      <rect x={i.x} y={i.y} width={i.width} height={i.height} fill={P.accent} />
    </svg>
  );
}

export function Dial({ size }: { size: number }) {
  const c = size / 2;
  const r = size * 0.44;
  const ticks = Array.from({ length: 100 }, (_, k) => k).filter((k) => k > 0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r + size * 0.035} fill="none" stroke={P.line} strokeWidth={size * 0.06} />
      <circle cx={c} cy={c} r={r} fill={P.plate} />
      {ticks.map((k) => {
        const major = k % 10 === 0;
        const mid = k % 5 === 0;
        const len = major ? size * 0.07 : mid ? size * 0.045 : size * 0.025;
        const w = major ? 4 : mid ? 3 : 2;
        return <rect key={k} x={c - w / 2} y={c - r + size * 0.02} width={w} height={len} fill={major ? P.steelHi : mid ? P.inkFaint : P.control} transform={`rotate(${k * 3.6} ${c} ${c})`} />;
      })}
      <circle cx={c} cy={c} r={r * 0.48} fill={P.room} stroke={P.rule} strokeWidth={2} />
      <rect x={c - 4} y={c - r - size * 0.03} width={8} height={size * 0.13} fill={P.accent} />
    </svg>
  );
}

export function DialRuler({ width, detents = 3, active = 0 }: { width: number; detents?: number; active?: number }) {
  const minor = Array.from({ length: Math.floor(width / 8) + 1 }, (_, i) => i * 8);
  const stops = Array.from({ length: detents }, (_, i) => (detents === 1 ? 0 : (i * (width - 2)) / (detents - 1)));
  return (
    <div style={{ display: "flex", position: "relative", width, height: 22 }}>
      {minor.map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x, bottom: 1, width: 1, height: i % 5 === 0 ? 8 : 4, background: i % 5 === 0 ? P.inkFaint : P.rule }} />
      ))}
      {stops.map((x, i) => (
        <div key={`d${i}`} style={{ position: "absolute", left: x, bottom: 1, width: i === active ? 2 : 1, height: i === active ? 14 : 12, background: i === active ? P.accent : P.ink }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: P.rule }} />
    </div>
  );
}

export function Engraved({ children, size = 18, color = P.inkMuted }: { children: string; size?: number; color?: string }) {
  return <div style={{ display: "flex", fontFamily: "Hubot Sans Wide", fontWeight: 600, fontSize: size, letterSpacing: size * 0.12, textTransform: "uppercase", color }}>{children}</div>;
}

export function titleSize(text: string, sizes: [number, number][]): number {
  for (const [max, size] of sizes) if (text.length <= max) return size;
  return sizes[sizes.length - 1][1];
}
