import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const full = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#121315"/><path fill="#ECEAE5" fill-rule="evenodd" d="M140.6 404Q135.9 404 135.9 398.9V109.1Q135.9 104 140.6 104H209.8Q259.6 104 283.3 128.3Q307 152.6 307 201.6Q307 248.7 282.8 273.7Q258.7 298.7 211 298.7H189V398.9Q189 404 184.4 404ZM189 251.7H209.5Q232.4 251.7 243.1 239.7Q253.8 227.6 253.8 202.5Q253.8 175.1 243.2 163Q232.5 151 210.1 151H189Z"/><rect x="323.0" y="90" width="53.1" height="53.1" fill="#F39A2E"/><rect x="92.0" y="446" width="59.2" height="6" fill="#3A3D42"/><rect x="159.2" y="446" width="59.2" height="6" fill="#3A3D42"/><rect x="226.4" y="446" width="59.2" height="6" fill="#ECEAE5"/><rect x="293.6" y="446" width="59.2" height="6" fill="#3A3D42"/><rect x="360.8" y="446" width="59.2" height="6" fill="#3A3D42"/></svg>`;

const small = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><rect width="512" height="512" fill="#121315"/><path fill="#ECEAE5" fill-rule="evenodd" d="M140.6 404Q135.9 404 135.9 398.9V109.1Q135.9 104 140.6 104H209.8Q259.6 104 283.3 128.3Q307 152.6 307 201.6Q307 248.7 282.8 273.7Q258.7 298.7 211 298.7H189V398.9Q189 404 184.4 404ZM189 251.7H209.5Q232.4 251.7 243.1 239.7Q253.8 227.6 253.8 202.5Q253.8 175.1 243.2 163Q232.5 151 210.1 151H189Z"/><rect x="319.0" y="86.0" width="64" height="64" fill="#F39A2E"/></svg>`;

const tiny = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><rect width="256" height="256" fill="#121315"/><path fill="#ECEAE5" fill-rule="evenodd" d="M48 48H144Q176 48 176 80V112Q176 144 144 144H96V208H48ZM96 84V108H136Q140 108 140 104V88Q140 84 136 84Z"/><rect x="192" y="32" width="48" height="48" fill="#F39A2E"/></svg>`;

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
