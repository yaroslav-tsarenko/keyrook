import { createHash } from "node:crypto";

export function mediaId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

export function mediaPath(url: string): string {
  return `/media/${mediaId(url)}`;
}
