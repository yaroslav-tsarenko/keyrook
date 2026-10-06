import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const full = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#121315"/><path fill="#ECEAE5" transform="translate(-16.0 583.5)" d="M65 0Q55 0 55 -11L55 -644Q55 -655 65 -655L157 -655Q167 -655 167 -644L167 -480Q167 -460 166.5 -436.5Q166 -413 165 -389.5Q164 -366 162 -345L165 -345Q180 -375 196 -408Q212 -441 231 -475L342 -649Q344 -655 354 -655L462 -655Q468 -655 469.5 -651Q471 -647 468 -641L306 -386L486 -14Q489 -8 487 -4Q485 0 479 0L368 0Q360 0 356 -8L228 -288L167 -200L167 -11Q167 0 157 0Z"/><rect x="352" y="571.5" width="48" height="12" fill="#F39A2E"/></svg>`;

const small = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><rect width="32" height="32" fill="#121315"/><path fill="#ECEAE5" transform="translate(-16.0 583.5)" d="M65 0Q55 0 55 -11L55 -644Q55 -655 65 -655L157 -655Q167 -655 167 -644L167 -480Q167 -460 166.5 -436.5Q166 -413 165 -389.5Q164 -366 162 -345L165 -345Q180 -375 196 -408Q212 -441 231 -475L342 -649Q344 -655 354 -655L462 -655Q468 -655 469.5 -651Q471 -647 468 -641L306 -386L486 -14Q489 -8 487 -4Q485 0 479 0L368 0Q360 0 356 -8L228 -288L167 -200L167 -11Q167 0 157 0Z"/><rect x="352" y="571.5" width="48" height="12" fill="#F39A2E"/></svg>`;

const tiny = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><rect width="16" height="16" fill="#121315"/><path fill="#ECEAE5" transform="translate(-16.0 583.5)" d="M65 0Q55 0 55 -11L55 -644Q55 -655 65 -655L157 -655Q167 -655 167 -644L167 -480Q167 -460 166.5 -436.5Q166 -413 165 -389.5Q164 -366 162 -345L165 -345Q180 -375 196 -408Q212 -441 231 -475L342 -649Q344 -655 354 -655L462 -655Q468 -655 469.5 -651Q471 -647 468 -641L306 -386L486 -14Q489 -8 487 -4Q485 0 479 0L368 0Q360 0 356 -8L228 -288L167 -200L167 -11Q167 0 157 0Z"/><rect x="352" y="571.5" width="48" height="12" fill="#F39A2E"/></svg>`;

const targets = [
  { size: 16, name: "favicon-16x16.png", source: tiny },
  { size: 32, name: "favicon-32x32.png", source: small },
  { size: 180, name: "apple-touch-icon.png", source: full },
  { size: 192, name: "android-chrome-192x192.png", source: full },
  { size: 512, name: "android-chrome-512x512.png", source: full },
];

async function render(source, size) {
  return sharp(Buffer.from(source), { density: Math.max(72, Math.ceil((72 * size) / 32)) })
    .resize(size, size)
    .png()
    .toBuffer();
}

for (const { size, name, source } of targets) {
  await writeFile(join(publicDir, name), await render(source, size));
  console.log("Generated", name);
}

const icoImages = [
  { size: 16, data: await render(tiny, 16) },
  { size: 32, data: await render(small, 32) },
  { size: 48, data: await render(small, 48) },
];

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);

let offset = 6 + icoImages.length * 16;
const entries = icoImages.map(({ size, data }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

await writeFile(join(publicDir, "favicon.ico"), Buffer.concat([header, ...entries, ...icoImages.map((i) => i.data)]));
console.log("Generated favicon.ico (16, 32, 48)");
