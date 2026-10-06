import { SITE_URL } from "@/lib/brand";
import { isBlockedImageHost } from "@/lib/utils/supplier";

export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function publicImageUrls(urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || isBlockedImageHost(url)) continue;
    if (!/^(https?:)?\/\//i.test(url) && !url.startsWith("/")) continue;
    const absolute = absoluteUrl(url);
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    out.push(absolute);
  }
  return out;
}
