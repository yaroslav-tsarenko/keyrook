const SCRAMBLE = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SEPARATOR = /[-–—\s]/;

export type DecryptPhase = "masked" | "scramble" | "settled" | "done";

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export function decryptGlyph(key: string, i: number, progress: number): { char: string; phase: DecryptPhase } {
  const chars = Array.from(key);
  const real = chars[i] ?? "";
  if (SEPARATOR.test(real)) return { char: real, phase: "done" };
  const n = chars.length;
  const t = 0.08 + (0.84 * i) / Math.max(1, n - 1);
  if (progress >= t + 0.04) return { char: real, phase: "done" };
  if (progress >= t) return { char: real, phase: "settled" };
  if (progress >= t - 0.18) return { char: SCRAMBLE[hash(i, Math.floor(progress * 48)) % SCRAMBLE.length]!, phase: "scramble" };
  return { char: "•", phase: "masked" };
}
