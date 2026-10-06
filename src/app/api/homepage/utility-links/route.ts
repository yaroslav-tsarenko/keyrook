import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const links = await prisma.utilityLink.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching utility links:", error);
    return NextResponse.json({ error: "Failed to fetch utility links" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();

    const link = await prisma.utilityLink.create({
      data: body,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error creating utility link:", error);
    return NextResponse.json({ error: "Failed to create utility link" }, { status: 500 });
  }
}
