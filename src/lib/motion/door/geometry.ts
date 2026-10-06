export const DOOR = {
  radius: 1,
  thickness: 0.2,
  chamfer: 0.02,
  segments: 96,
  frameRadius: 1.12,
  frameDepth: 0.22,
  frameLip: 0.1,
  dial: { radius: 0.32, thickness: 0.06, y: 0.18, ticks: 100, numeralEvery: 10 },
  index: { width: 0.014, height: 0.07, gap: 0.03 },
  handle: { y: -0.34, hub: 0.075, spoke: 0.26, spokeWidth: 0.032, spokes: 3, turn: 90 },
  bolts: { count: 8, radius: 0.045, length: 0.24, startDeg: 22.5, stepDeg: 45, retract: 0.16 },
  lamp: { radius: 0.036, x: 0.78, y: 0 },
  hinge: { x: -1.13, radius: 0.06, height: 0.34, ys: [0.52, -0.52] },
  interior: { depth: 1.2, columns: 4, rows: 3, cell: [0.6, 0.78], cover: [0.48, 0.64] },
  swing: { open: 108, reduced: 35, ajar: 22, mobile: 28 },
} as const;

export const DOOR_TIMELINE = {
  rest: [0, 0.08],
  dial: [0.08, 0.4],
  bolts: [0.4, 0.52],
  swing: [0.52, 0.86],
  dolly: [0.86, 1],
  contents: 0.86,
} as const;

export const DOOR_DIAL_STOPS = [0, -475.2, 36, -298.8] as const;

export const DOOR_CAMERA = { distance: 4.2, fovDeg: 35, dolly: 0.32, pointerDeg: 1.5 } as const;

export function boltAngles(): number[] {
  return Array.from({ length: DOOR.bolts.count }, (_, k) => DOOR.bolts.startDeg + DOOR.bolts.stepDeg * k);
}

export function dialTickAngles(): { deg: number; major: boolean; numeral: number | null }[] {
  return Array.from({ length: DOOR.dial.ticks }, (_, i) => ({
    deg: (i * 360) / DOOR.dial.ticks,
    major: i % 5 === 0,
    numeral: i % DOOR.dial.numeralEvery === 0 ? i : null,
  }));
}
