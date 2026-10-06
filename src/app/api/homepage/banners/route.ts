import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();

    const banner = await prisma.banner.create({
      data: body,
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
