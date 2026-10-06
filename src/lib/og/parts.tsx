import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
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
  return (
    <div style={{ display: "flex", fontFamily: "Sofia Sans Condensed", fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.01, color }}>
      <span>Keyrook</span>
    </div>
  );
}

export function Stage({ src, width, height }: { src: string | null; width: number; height: number }) {
  const inset = Math.round(width * 0.12);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        background: P.stage,
        backgroundImage: `radial-gradient(ellipse 70% 62% at 50% 0%, ${P.lampPool}, transparent 72%)`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: inset, right: inset, height: 1, background: P.lampLine }} />
      <div style={{ position: "absolute", left: "18%", right: "18%", bottom: "8%", height: 12, borderRadius: "50%", background: P.contact, filter: "blur(6px)" }} />
      {src ? (
        <img src={src} alt="" style={{ position: "absolute", left: "9%", top: "12%", width: "82%", height: "72%", objectFit: "contain" }} />
      ) : null}
    </div>
  );
}

export function Ruler({ width, lit = "FT" }: { width: number; lit?: "FN" | "MW" | "FT" | "WW" | "BS" }) {
  const zones: Record<string, [number, number]> = { FN: [0, 0.07], MW: [0.07, 0.15], FT: [0.15, 0.38], WW: [0.38, 0.45], BS: [0.45, 1] };
  const majors = [0, 0.07, 0.15, 0.38, 0.45, 1];
  const [a, b] = zones[lit];
  return (
    <div style={{ display: "flex", position: "relative", width, height: 20 }}>
      <div style={{ position: "absolute", left: a * width, width: (b - a) * width, bottom: 1, height: 6, background: P.ink }} />
      {Array.from({ length: 21 }, (_, i) => i * 0.05).map((v) => (
        <div key={v} style={{ position: "absolute", left: v * width, bottom: 1, width: 1, height: 7, background: P.rule }} />
      ))}
      {majors.map((v) => (
        <div key={v} style={{ position: "absolute", left: Math.min(width - 1, v * width), bottom: 1, width: 1, height: 14, background: P.ink }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: P.rule }} />
    </div>
  );
}

export function titleSize(text: string, sizes: [number, number][]): number {
  for (const [max, size] of sizes) if (text.length <= max) return size;
  return sizes[sizes.length - 1][1];
}
