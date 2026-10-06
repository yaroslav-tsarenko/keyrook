import { resolveImageSrc } from "@/lib/image-loader";
import { dialTickAngles } from "./geometry";

export type Rgb = [number, number, number];

export interface DoorPalette {
  light: boolean;
  bg: Rgb;
  recess: Rgb;
  stage: Rgb;
  plate: Rgb;
  steel: Rgb;
  steelHi: Rgb;
  accent: Rgb;
  lampOff: Rgb;
  ink: Rgb;
  muted: Rgb;
}

export interface VaultCoverInput {
  src: string;
  title?: string;
}

const TOKENS = {
  bg: "--color-bg",
  recess: "--color-bg-tertiary",
  stage: "--color-stage",
  plate: "--color-plate",
  steelHi: "--color-steel-hi",
  accent: "--color-accent",
  lampOff: "--color-lamp-off",
  ink: "--color-text",
  muted: "--color-text-tertiary",
} as const;

function parseColor(ctx: CanvasRenderingContext2D, value: string): Rgb {
  ctx.fillStyle = "#000";
  ctx.fillStyle = value || "#000";
  const v = String(ctx.fillStyle);
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1, 7), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const parts = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function scale(a: Rgb, k: number): Rgb {
  return [a[0] * k, a[1] * k, a[2] * k];
}

function css(c: Rgb, alpha = 1): string {
  return `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)} / ${alpha})`;
}

export function readPalette(): DoorPalette {
  const style = getComputedStyle(document.documentElement);
  const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
  const read = (name: string) => parseColor(ctx, style.getPropertyValue(name).trim());
  const plate = read(TOKENS.plate);
  const steelHi = read(TOKENS.steelHi);
  const light = document.documentElement.dataset.theme === "light";
  return {
    light,
    bg: read(TOKENS.bg),
    recess: read(TOKENS.recess),
    stage: read(TOKENS.stage),
    plate,
    steel: mix(plate, steelHi, light ? 0.12 : 0.3),
    steelHi,
    accent: read(TOKENS.accent),
    lampOff: read(TOKENS.lampOff),
    ink: read(TOKENS.ink),
    muted: read(TOKENS.muted),
  };
}

function monoFamily(): string {
  const probe = document.createElement("span");
  probe.className = "font-mono";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || "monospace";
  probe.remove();
  return family;
}

export function drawDialFace(canvas: HTMLCanvasElement, palette: DoorPalette): void {
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = size / 2;
  const face = mix(palette.steel, palette.steelHi, palette.light ? 0.05 : 0.08);
  ctx.fillStyle = css(face);
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 180; i++) {
    const a0 = (i / 180) * Math.PI * 2;
    const a1 = ((i + 0.5) / 180) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, c, a0, a1);
    ctx.closePath();
    ctx.fillStyle = css(scale(face, 0.72));
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(c, c, c * 0.93, 0, Math.PI * 2);
  ctx.fillStyle = css(face);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = css(scale(face, 0.6));
  ctx.stroke();

  const engrave = palette.ink;
  const tickColor = palette.light ? palette.ink : palette.muted;
  ctx.save();
  ctx.translate(c, c);
  for (const tick of dialTickAngles()) {
    ctx.save();
    ctx.rotate((tick.deg * Math.PI) / 180);
    const long = tick.numeral !== null ? 0.11 : tick.major ? 0.08 : 0.045;
    ctx.fillStyle = css(tick.numeral !== null ? engrave : tickColor, tick.numeral !== null ? 0.95 : 0.8);
    const w = tick.numeral !== null ? 7 : tick.major ? 5 : 3;
    ctx.fillRect(-w / 2, -c * 0.9, w, c * long);
    ctx.restore();
  }
  ctx.fillStyle = css(engrave, 0.92);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 70px ${monoFamily()}`;
  for (const tick of dialTickAngles()) {
    if (tick.numeral === null) continue;
    const a = (tick.deg * Math.PI) / 180;
    const r = c * 0.66;
    ctx.save();
    ctx.translate(Math.sin(a) * r, -Math.cos(a) * r);
    ctx.rotate(a);
    ctx.fillText(String(tick.numeral), 0, 0);
    ctx.restore();
  }
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.arc(0, 0, c * (0.3 - k * 0.04), 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = css(k % 2 ? scale(face, 0.8) : mix(face, palette.steelHi, 0.2));
    ctx.stroke();
  }
  ctx.restore();
}

export interface AtlasCell {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ATLAS = { width: 2048, height: 1024, lead: { x: 0, y: 0, w: 768, h: 1024 } } as const;

export function atlasCell(index: number): AtlasCell {
  if (index === 0) return ATLAS.lead;
  const k = index - 1;
  const col = k % 4;
  const row = Math.floor(k / 4);
  return { x: 768 + col * 320 + 32, y: row * 341, w: 256, h: 341 };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const absolute = /^https?:\/\//i.test(src);
    if (absolute && new URL(src).origin !== window.location.origin) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cell: AtlasCell, palette: DoorPalette) {
  const ratio = img.naturalWidth / img.naturalHeight;
  const target = cell.w / cell.h;
  const portrait = ratio >= 0.68 && ratio <= 0.82;
  ctx.fillStyle = css(palette.stage);
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  if (portrait) {
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (ratio > target) sw = sh * target;
    else sh = sw / target;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, cell.x, cell.y, cell.w, cell.h);
    return;
  }
  const s = Math.min(cell.w / img.naturalWidth, cell.h / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.drawImage(img, cell.x + (cell.w - w) / 2, cell.y + (cell.h - h) / 2, w, h);
}

export async function paintAtlas(canvas: HTMLCanvasElement, covers: VaultCoverInput[], palette: DoorPalette, alive: () => boolean): Promise<boolean[]> {
  canvas.width = ATLAS.width;
  canvas.height = ATLAS.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return covers.map(() => false);
  ctx.fillStyle = css(palette.stage);
  ctx.fillRect(0, 0, ATLAS.width, ATLAS.height);
  const images = await Promise.all(covers.map((cover, i) => loadImage(resolveImageSrc(cover.src, i === 0 ? 640 : 320))));
  if (!alive()) return covers.map(() => false);
  return images.map((img, i) => {
    if (!img) return false;
    try {
      drawCover(ctx, img, atlasCell(i), palette);
      return true;
    } catch {
      return false;
    }
  });
}
