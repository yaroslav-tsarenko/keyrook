import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const C = 320;
const DOOR_R = 280;
const DIAL = { x: C, y: C - 0.18 * DOOR_R, r: 86 };
const HANDLE = { x: C, y: C + 0.34 * DOOR_R };
const BOLT_ANGLES = Array.from({ length: 8 }, (_, k) => 22.5 + 45 * k);

function polar(r: number, deg: number, cx = C, cy = C) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function DialFace({ rotation = 0 }: { rotation?: number }) {
  return (
    <g data-door-dial="" transform={`rotate(${rotation} ${DIAL.x} ${DIAL.y})`}>
      {Array.from({ length: 120 }, (_, i) => {
        const a = polar(DIAL.r, i * 3, DIAL.x, DIAL.y);
        const b = polar(DIAL.r + 6, i * 3, DIAL.x, DIAL.y);
        return <line key={`k${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-border-control)" strokeWidth="1.4" />;
      })}
      <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r} fill="var(--color-raised)" stroke="var(--color-border-control)" strokeWidth="1.5" />
      {Array.from({ length: 100 }, (_, i) => {
        const major = i % 10 === 0;
        const a = polar(DIAL.r - 2, i * 3.6, DIAL.x, DIAL.y);
        const b = polar(DIAL.r - (major ? 13 : i % 5 === 0 ? 9 : 6), i * 3.6, DIAL.x, DIAL.y);
        return <line key={`t${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major ? "var(--color-text-secondary)" : "var(--color-border-hover)"} strokeWidth={major ? 1.6 : 1} />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const p = polar(DIAL.r - 24, i * 36, DIAL.x, DIAL.y);
        return (
          <text key={`n${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="var(--color-text-secondary)" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 500 }}>
            {i * 10}
          </text>
        );
      })}
      <circle cx={DIAL.x} cy={DIAL.y} r="30" fill="var(--color-plate)" stroke="var(--color-border-control)" strokeWidth="1.2" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = polar(24, i * 15, DIAL.x, DIAL.y);
        const b = polar(29, i * 15, DIAL.x, DIAL.y);
        return <line key={`g${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-border-hover)" strokeWidth="2" />;
      })}
      <circle cx={DIAL.x} cy={DIAL.y} r="16" fill="var(--color-raised)" stroke="var(--color-border)" />
    </g>
  );
}

function Leaf({ lit = false, uid }: { lit?: boolean; uid: string }) {
  const grip = (deg: number) => {
    const end = polar(64, deg, HANDLE.x, HANDLE.y);
    return (
      <g key={deg}>
        <line x1={HANDLE.x} y1={HANDLE.y} x2={end.x} y2={end.y} stroke="var(--color-border-control)" strokeWidth="11" strokeLinecap="butt" />
        <line x1={HANDLE.x} y1={HANDLE.y} x2={end.x} y2={end.y} stroke="var(--color-plate)" strokeWidth="7" strokeLinecap="butt" />
        <circle cx={end.x} cy={end.y} r="10" fill="var(--color-plate)" stroke="var(--color-border-control)" strokeWidth="1.4" />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 640 640" className="block h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <pattern id={`${uid}-grain`} width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="1" height="3" fill="var(--color-steel-hi)" opacity="0.03" />
        </pattern>
        <clipPath id={`${uid}-clip`}>
          <circle cx={C} cy={C} r={DOOR_R} />
        </clipPath>
      </defs>
      {BOLT_ANGLES.map((deg) => {
        const p = polar(DOOR_R - 6, deg);
        return <rect key={deg} data-door-bolt="" x={p.x - 9} y={p.y - 22} width="18" height="44" fill="var(--color-border-control)" stroke="var(--color-border-hover)" transform={`rotate(${deg} ${p.x} ${p.y}) translate(0 -14)`} />;
      })}
      <circle cx={C} cy={C} r={DOOR_R} fill="var(--color-plate)" />
      <circle cx={C} cy={C} r={DOOR_R} fill={`url(#${uid}-grain)`} />
      <g clipPath={`url(#${uid}-clip)`} opacity="0.5">
        {Array.from({ length: 44 }, (_, i) => (
          <circle key={i} cx={C} cy={C} r={20 + i * 6} fill="none" stroke="var(--color-steel-hi)" strokeOpacity="0.05" strokeWidth="1" />
        ))}
      </g>
      <circle cx={C} cy={C} r={DOOR_R - 1} fill="none" stroke="var(--color-border-control)" strokeWidth="2" />
      <circle cx={C} cy={C} r={DOOR_R - 14} fill="none" stroke="var(--color-border)" strokeWidth="1" />
      <path d={`M ${polar(DOOR_R - 3, -60).x} ${polar(DOOR_R - 3, -60).y} A ${DOOR_R - 3} ${DOOR_R - 3} 0 0 1 ${polar(DOOR_R - 3, 60).x} ${polar(DOOR_R - 3, 60).y}`} fill="none" stroke="var(--color-steel-hi)" strokeOpacity="0.28" strokeWidth="1.5" />
      {[45, 135, 225, 315].map((deg) => {
        const p = polar(DOOR_R - 34, deg);
        return <circle key={deg} cx={p.x} cy={p.y} r="5" fill="var(--color-border-control)" stroke="var(--color-steel-hi)" strokeOpacity="0.25" />;
      })}
      <rect x={DIAL.x - 1.5} y={DIAL.y - DIAL.r - 26} width="3" height="16" fill="var(--color-accent)" data-door-index="" />
      <DialFace rotation={-18} />
      <g data-door-handle="">
        {[0, 120, 240].map(grip)}
        <circle cx={HANDLE.x} cy={HANDLE.y} r="22" fill="var(--color-plate)" stroke="var(--color-border-control)" strokeWidth="1.5" />
        <circle cx={HANDLE.x} cy={HANDLE.y} r="9" fill="var(--color-raised)" stroke="var(--color-border)" />
      </g>
      <g data-door-lamp="" data-lit={lit || undefined}>
        <circle cx={C + DOOR_R - 52} cy={C} r="6" fill={lit ? "var(--color-lamp-on)" : "var(--color-lamp-off)"} stroke="var(--color-border-control)" strokeWidth="1" />
      </g>
      <rect x={C - 62} y={C + DOOR_R - 76} width="124" height="24" fill="var(--color-raised)" stroke="var(--color-border)" />
      <text x={C} y={C + DOOR_R - 64} textAnchor="middle" dominantBaseline="central" fill="var(--color-text-secondary)" style={{ fontFamily: "var(--font-display)", fontStretch: "125%", fontWeight: 600, fontSize: 11, letterSpacing: "0.22em" }}>
        KEYROOK
      </text>
    </svg>
  );
}

function Recess() {
  return (
    <svg viewBox="0 0 640 640" className="absolute inset-0 block h-full w-full" aria-hidden="true">
      <circle cx={C} cy={C} r="312" fill="var(--color-bg-tertiary)" />
      <circle cx={C} cy={C} r="312" fill="none" stroke="var(--color-border)" />
      <circle cx={C} cy={C} r="300" fill="none" stroke="var(--color-rule)" strokeWidth="2" />
      {BOLT_ANGLES.map((deg) => {
        const p = polar(304, deg);
        return <rect key={deg} x={p.x - 11} y={p.y - 7} width="22" height="14" fill="var(--color-bg)" stroke="var(--color-border)" transform={`rotate(${deg} ${p.x} ${p.y})`} />;
      })}
      {[-48, 48].map((dy) => (
        <rect key={dy} x="2" y={C + dy * 2.6 - 34} width="20" height="68" fill="var(--color-plate)" stroke="var(--color-border-control)" />
      ))}
    </svg>
  );
}

export type DoorState = "closed" | "ajar" | "open";

export function DoorPoster({ uid, state = "closed", angle, lit = false, interior, label, className }: { uid: string; state?: DoorState; angle?: number; lit?: boolean; interior?: ReactNode; label?: string; className?: string }) {
  return (
    <div
      data-door-poster=""
      data-door-state={state}
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("door-poster", className)}
      style={angle !== undefined ? ({ ["--door-angle" as string]: `${angle}deg` } as CSSProperties) : undefined}
    >
      <Recess />
      <div data-door-interior="" data-depth="D3" className="door-interior">
        {interior}
      </div>
      <div data-door-leaf="" data-depth="D2" className="door-leaf">
        <Leaf lit={lit} uid={uid} />
      </div>
    </div>
  );
}
