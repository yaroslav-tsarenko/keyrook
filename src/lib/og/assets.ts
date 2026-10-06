import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/brand";
import { isBlockedImageHost } from "@/lib/utils/supplier";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_PALETTE = {
  room: "#121315",
  rig: "#0d0e10",
  floor: "#0b0c0d",
  stage: "#18191c",
  raised: "#1c1e21",
  ink: "#eceae5",
  inkMuted: "#aaa7a0",
  rule: "#3a3d42",
  line: "#2a2c30",
  accent: "#f39a2e",
  lampLine: "rgba(255, 233, 199, 0.55)",
  lampPool: "rgba(255, 233, 199, 0.09)",
  contact: "rgba(0, 0, 0, 0.55)",
} as const;

type FontSpec = { name: string; file: string; weight: 400 | 500 | 600 | 700; style: "normal" };

const FONT_FILES: FontSpec[] = [
  { name: "Sofia Sans Condensed", file: "sofia-sans-condensed-latin-700-normal.woff", weight: 700, style: "normal" },
  { name: "Source Sans 3", file: "source-sans-3-latin-400-normal.woff", weight: 400, style: "normal" },
  { name: "Source Sans 3", file: "source-sans-3-latin-600-normal.woff", weight: 600, style: "normal" },
  { name: "Martian Mono", file: "martian-mono-latin-500-normal.woff", weight: 500, style: "normal" },
];

let fontCache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" }[]> | null = null;

export function ogFonts() {
  fontCache ??= Promise.all(
    FONT_FILES.map(async (font) => {
      try {
        const buffer = await readFile(join(process.cwd(), "public", "fonts", font.file));
        return { name: font.name, data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer, weight: font.weight, style: font.style };
      } catch {
        return null;
      }
    }),
  ).then((fonts) => fonts.filter((f): f is NonNullable<typeof f> => f !== null));
  return fontCache;
}

function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 12).startsWith("ftypavi")) return "image/avif";
  if (buf.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return null;
}

function publicFile(url: string): string | null {
  let pathname: string;
  if (url.startsWith("/") && !url.startsWith("//")) {
    pathname = url.split(/[?#]/)[0];
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== new URL(SITE_URL).origin) return null;
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const segments = decoded.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === "." || segment === ".." || segment.includes("\0"))) return null;
  return segments.join("/");
}

async function readBytes(url: string): Promise<Buffer | null> {
  const local = publicFile(url);
  if (local) {
    try {
      return await readFile(join(process.cwd(), "public", local));
    } catch {
      if (url.startsWith("/")) return null;
    }
  }
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function toPng(buf: Buffer, max: number): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buf).resize({ width: max, height: max, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function ogImageSource(url: string | null | undefined, max = 900): Promise<string | null> {
  if (!url || isBlockedImageHost(url)) return null;
  const bytes = await readBytes(url);
  if (!bytes) return null;
  const type = sniff(bytes);
  if (!type) return null;
  const png = await toPng(bytes, max);
  if (png) return `data:image/png;base64,${png.toString("base64")}`;
  if (type === "image/png" || type === "image/jpeg") return `data:${type};base64,${bytes.toString("base64")}`;
  return null;
}
