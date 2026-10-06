export const IMAGE_VARIANT_WIDTHS = [320, 480, 640, 960, 1280] as const;
export const IMAGE_VARIANT_PARAM = "vw";
export const IMAGE_VARIANT_FORMAT = "webp";

const MAX_WIDTH = 10000;

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export function variantWidthsFor(sourceWidth: number, ladder: readonly number[] = IMAGE_VARIANT_WIDTHS): number[] {
  if (!Number.isFinite(sourceWidth) || sourceWidth < 1) return [];
  const sorted = [...new Set(ladder.filter((w) => Number.isInteger(w) && w > 0))].sort((a, b) => a - b);
  if (!sorted.length) return [];
  const top = Math.min(Math.floor(sourceWidth), sorted[sorted.length - 1]);
  return [...sorted.filter((w) => w < top), top];
}

export function variantPath(originalPath: string, width: number): string {
  const slash = originalPath.lastIndexOf("/");
  const dir = originalPath.slice(0, slash + 1);
  const file = originalPath.slice(slash + 1);
  const dot = file.lastIndexOf(".");
  const stem = dot > 0 ? file.slice(0, dot) : file;
  return `${dir}${stem}-w${width}.${IMAGE_VARIANT_FORMAT}`;
}

export function encodeVariantWidths(widths: readonly number[]): string {
  return widths.join("-");
}

export function parseVariantWidths(value: string | null | undefined): number[] | null {
  if (!value || !/^\d+(?:-\d+)*$/.test(value)) return null;
  const widths = value.split("-").map(Number);
  for (let i = 0; i < widths.length; i++) {
    if (widths[i] < 1 || widths[i] > MAX_WIDTH) return null;
    if (i > 0 && widths[i] <= widths[i - 1]) return null;
  }
  return widths;
}

export function withVariantMarker(originalUrl: string, widths: readonly number[]): string {
  if (!widths.length) return originalUrl;
  const marker = `${IMAGE_VARIANT_PARAM}=${encodeVariantWidths(widths)}`;
  const clean = stripVariantMarker(originalUrl);
  return `${clean}${clean.includes("?") ? "&" : "?"}${marker}`;
}

export function stripVariantMarker(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has(IMAGE_VARIANT_PARAM)) return url;
    parsed.searchParams.delete(IMAGE_VARIANT_PARAM);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function pickVariantWidth(widths: readonly number[], requested: number): number {
  return widths.find((w) => w >= requested) ?? widths[widths.length - 1];
}

export function resolveImageSrc(src: string, width: number): string {
  if (!/^https?:\/\//i.test(src)) return src;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  const widths = parseVariantWidths(url.searchParams.get(IMAGE_VARIANT_PARAM));
  if (!widths) return src;
  if (!/\/[^/]+\.[a-z0-9]{3,4}$/i.test(url.pathname)) return src;
  const chosen = pickVariantWidth(widths, width);
  return `${url.origin}${variantPath(url.pathname, chosen)}`;
}

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const resolved = resolveImageSrc(src, width);
  if (resolved !== src || !/^https?:\/\//i.test(src) || src.includes("#")) return resolved;
  return `${src}#w${width}`;
}
