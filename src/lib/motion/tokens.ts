export const MOTION_DURATION = {
  micro: 120,
  ui: 180,
  panel: 260,
  panelClose: 200,
  tumbler: 520,
  reveal: 640,
  reduced: 120,
  cartFlight: 400,
  decrypt: 900,
  doorOpen: 1800,
} as const;

export const MOTION_EASE = {
  latch: [0.3, 0, 0.1, 1],
  std: [0.4, 0, 0.2, 1],
  inOut: [0.76, 0, 0.24, 1],
  outExpo: [0.16, 1, 0.3, 1],
} as const;

export type MotionEase = keyof typeof MOTION_EASE;

export function cssEase(name: MotionEase): string {
  return `cubic-bezier(${MOTION_EASE[name].join(", ")})`;
}

export const MOTION_SPRING = { stiffness: 420, damping: 38 } as const;

export const MOTION_DEPTH = {
  D0: { pointer: 0, scroll: 0 },
  D1: { pointer: 3, scroll: 0.04 },
  D2: { pointer: 6, scroll: 0.08 },
  D3: { pointer: 10, scroll: 0.12 },
  D4: { pointer: 12, scroll: 0.05 },
  L0: { pointer: 0, scroll: 0 },
} as const;

export const MOTION_STAGGER = { chars: 28, rows: 70, lockers: 60, words: 40, ticks: 3, items: 70, tumblers: 40 } as const;

export const MOTION_LIMITS = {
  lockerSwing: 24,
  doorSwing: 108,
  cardDrawer: 6,
  dprCap: 1.5,
  pointerDoor: 6,
  decryptGlyphs: 4,
  cartGhost: 40,
  cartGhostOpacity: 0.9,
} as const;

export const MOTION_QUERY = {
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;
