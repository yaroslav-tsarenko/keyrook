import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { IMAGE_VARIANT_PARAM, parseVariantWidths, stripVariantMarker, variantPath } from "./image-loader";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

function hasPublicUrl(): boolean {
  return !!(R2_PUBLIC_URL && !R2_PUBLIC_URL.includes("cloudflarestorage.com"));
}

function getPublicUrl(key: string): string {
  if (hasPublicUrl()) {
    const base = R2_PUBLIC_URL.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}

export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "products",
): Promise<string> {
  const key = `${folder}/${fileName}`;

  if (!isR2Configured()) {
    throw new Error("R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env");
  }

  if (!hasPublicUrl()) {
    console.warn(
      "[r2] R2_PUBLIC_URL is not set — uploaded objects will not be browser-accessible. " +
        "Enable public access on the bucket in Cloudflare dashboard and set R2_PUBLIC_URL in .env.",
    );
  }

  const client = getR2Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    const e = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    console.error("[r2] PutObject failed", {
      bucket: R2_BUCKET_NAME,
      key,
      name: e.name,
      message: e.message,
      httpStatusCode: e.$metadata?.httpStatusCode,
    });
    throw new Error(`R2 upload failed: ${e.name || "Unknown"} — ${e.message || "no message"}`);
  }

  return getPublicUrl(key);
}

export function r2KeyFromUrl(url: string): string {
  const clean = stripVariantMarker(url);
  const base = R2_PUBLIC_URL.replace(/\/$/, "");
  if (base && clean.startsWith(`${base}/`)) return clean.slice(base.length + 1);
  if (clean.startsWith(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/`)) return clean.slice(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/`.length);
  return clean;
}

function variantKeysFromUrl(url: string, key: string): string[] {
  try {
    const widths = parseVariantWidths(new URL(url).searchParams.get(IMAGE_VARIANT_PARAM));
    return widths ? widths.map((w) => variantPath(key, w)) : [];
  } catch {
    return [];
  }
}

export async function deleteFromR2(url: string): Promise<void> {
  if (!isR2Configured()) return;

  const key = r2KeyFromUrl(url);
  const client = getR2Client();

  for (const k of [key, ...variantKeysFromUrl(url, key)]) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: k,
      }),
    );
  }
}

let sharedClient: S3Client | null = null;

function getSharedR2Client(): S3Client {
  if (!sharedClient) sharedClient = getR2Client();
  return sharedClient;
}

export function r2PublicUrl(key: string): string {
  return getPublicUrl(key);
}

export async function headR2Object(key: string): Promise<{ exists: boolean; metadata: Record<string, string>; size: number | null }> {
  if (!isR2Configured()) throw new Error("R2 storage is not configured");
  try {
    const res = await getSharedR2Client().send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return { exists: true, metadata: res.Metadata || {}, size: res.ContentLength ?? null };
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NotFound" || e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) {
      return { exists: false, metadata: {}, size: null };
    }
    throw err;
  }
}

export async function getR2Object(key: string): Promise<Buffer | null> {
  if (!isR2Configured()) throw new Error("R2 storage is not configured");
  try {
    const res = await getSharedR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    if (!res.Body) return null;
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NotFound" || e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

export async function putR2Object(
  key: string,
  body: Buffer,
  contentType: string,
  options: { metadata?: Record<string, string>; cacheControl?: string } = {},
): Promise<string> {
  if (!isR2Configured()) throw new Error("R2 storage is not configured");
  await getSharedR2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: options.cacheControl,
      Metadata: options.metadata,
    }),
  );
  return getPublicUrl(key);
}

export { isR2Configured, hasPublicUrl as hasR2PublicUrl };
