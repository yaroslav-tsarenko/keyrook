import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { NEW_PRODUCT_WINDOW_DAYS } from "@/lib/homepage-products";

const DAY_MS = 24 * 60 * 60 * 1000;
export const INITIAL_CATALOGUE_DAYS = 7;

export const newArrivalCutoff = cache(async (): Promise<number> => {
  const windowStart = Date.now() - NEW_PRODUCT_WINDOW_DAYS * DAY_MS;
  const { _min } = await prisma.product.aggregate({ where: { status: "ACTIVE" }, _min: { createdAt: true } });
  const earliest = _min.createdAt?.getTime();
  return earliest == null ? windowStart : Math.max(windowStart, earliest + INITIAL_CATALOGUE_DAYS * DAY_MS);
});

export function isNewArrival(createdAt: Date | string | number | null | undefined, cutoff: number): boolean {
  if (createdAt == null) return false;
  const time = new Date(createdAt).getTime();
  return Number.isFinite(time) && time >= cutoff;
}
