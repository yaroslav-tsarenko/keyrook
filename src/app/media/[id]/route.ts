import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) return new NextResponse(null, { status: 404 });
  const source = await prisma.mediaSource.findUnique({ where: { id }, select: { url: true } });
  if (!source) return new NextResponse(null, { status: 404 });

  try {
    const upstream = await fetch(source.url, { signal: AbortSignal.timeout(15_000), headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" }, cache: "no-store" });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.startsWith("image/")) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_BYTES) return new NextResponse(null, { status: 404 });
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new NextResponse(null, { status: 504, headers: { "Cache-Control": "public, max-age=60" } });
  }
}
