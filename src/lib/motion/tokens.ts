export const MOTION_DURATION = {
  micro: 140,
  ui: 200,
  panel: 280,
  panelClose: 220,
  reveal: 700,
  reduced: 120,
  cartFlight: 420,
  lampSweep: 1600,
} as const;

export const MOTION_EASE = {
  instrument: [0.2, 0.8, 0.2, 1],
  std: [0.4, 0, 0.2, 1],
  inOut: [0.76, 0, 0.24, 1],
  outExpo: [0.16, 1, 0.3, 1],
} as const;

export type MotionEase = keyof typeof MOTION_EASE;

export function cssEase(name: MotionEase): string {
  return `cubic-bezier(${MOTION_EASE[name].join(", ")})`;
}

export const MOTION_SPRING = { stiffness: 260, damping: 30 } as const;

export const MOTION_DEPTH = [
  { pointer: 0, scroll: 0 },
  { pointer: 3, scroll: 0.04 },
  { pointer: 8, scroll: 0.08 },
  { pointer: 12, scroll: 0.12 },
  { pointer: 14, scroll: 0.06 },
] as const;

export const MOTION_STAGGER = { ticks: 4, bays: 80, spines: 60, words: 40 } as const;

export const MOTION_LIMITS = {
  tiltCatalog: 4,
  tiltHome: 8,
  tiltInspectYaw: 25,
  tiltInspectPitch: 10,
  inspectDragYaw: 0.25,
  inspectDragPitch: 0.2,
  inspectKeyStep: 5,
  lampLerp: 0.12,
  lampDim: 0.4,
  renderInStage: 4,
  liftCatalog: 3,
  perspectiveTray: 900,
  perspectiveHero: 1400,
  perspectiveInspect: 1100,
  heroSettleUntil: 0.5,
  cartGhost: 40,
  cartGhostOpacity: 0.9,
  dprCap: 1.5,
} as const;

export const LAMP_POSE = {
  rest: { x: 0.5, y: 0 },
  rake: { x: 0.14, y: -0.06 },
  sweepFrom: { x: -0.15, y: -0.08 },
  sweepTo: { x: 1.1, y: -0.02 },
} as const;

export const MOTION_QUERY = {
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;

export const MOTION_WALK = { lead: 0.04, span: 0.92, rise: 0.05 } as const;

export function walkProgress(float: number): string {
  return `${((MOTION_WALK.lead + float * MOTION_WALK.span) * 100).toFixed(2)}%`;
}
