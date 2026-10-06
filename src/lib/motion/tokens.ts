export const MOTION_DURATION = {
  micro: 140,
  ui: 200,
  panel: 280,
  panelClose: 220,
  reveal: 700,
  reduced: 120,
  cartFlight: 420,
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

export const MOTION_STAGGER = { words: 40, items: 60 } as const;

export const MOTION_LIMITS = {
  cartGhost: 40,
  cartGhostOpacity: 0.9,
} as const;

export const MOTION_QUERY = {
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;
