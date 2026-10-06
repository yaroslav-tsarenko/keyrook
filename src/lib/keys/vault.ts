import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const VERSION = "v1";

function material(info: string): Buffer {
  return Buffer.from(hkdfSync("sha256", Buffer.from(env.KEY_ENCRYPTION_SECRET, "utf8"), Buffer.from("keyrook-key-vault"), Buffer.from(info), 32));
}

let cached: { enc: Buffer; mac: Buffer } | null = null;

function keys() {
  cached ??= { enc: material("aes-256-gcm"), mac: material("fingerprint") };
  return cached;
}

export function encryptKey(plain: string, boundTo: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys().enc, iv);
  cipher.setAAD(Buffer.from(boundTo, "utf8"));
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(":");
}

export function decryptKey(secret: string, boundTo: string): string {
  const [version, iv, tag, ct] = secret.split(":");
  if (version !== VERSION || !iv || !tag || !ct) throw new Error("Unsupported key secret format");
  const decipher = createDecipheriv("aes-256-gcm", keys().enc, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(boundTo, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

export function keyFingerprint(plain: string): string {
  return createHmac("sha256", keys().mac).update(plain.trim()).digest("hex");
}

export function maskKey(plain: string): string {
  const clean = plain.trim();
  if (clean.length <= 4) return "••••";
  return `${"•".repeat(Math.min(16, clean.length - 4))}${clean.slice(-4)}`;
}
