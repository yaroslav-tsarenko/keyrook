import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToR2, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME." },
        { status: 500 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error("[upload] Failed to parse formData", err);
      return NextResponse.json(
        { error: "Request body too large or malformed. Max ~4MB per upload." },
        { status: 413 },
      );
    }

    const file = formData.get("file") as File;
    const requestedFolder = formData.get("folder");
    const folder = typeof requestedFolder === "string" && /^[a-z0-9-]{1,40}$/.test(requestedFolder) ? requestedFolder : "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, AVIF, GIF` },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 4MB.` },
        { status: 413 },
      );
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(buffer, fileName, file.type, folder);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
