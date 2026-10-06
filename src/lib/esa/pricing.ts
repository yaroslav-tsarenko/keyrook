import { env } from "@/lib/env";

export function computeSellPrice(cost: number, opts?: { margin?: number; minMarginAbs?: number }): number {
  const margin = opts?.margin ?? env.CATALOG_MARGIN;
  const minAbs = opts?.minMarginAbs ?? env.CATALOG_MIN_MARGIN_ABS;
  return ceil2(Math.max(cost * (1 + margin), cost + minAbs));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function ceil2(n: number): number {
  return Math.ceil((n - Number.EPSILON) * 100) / 100;
}
