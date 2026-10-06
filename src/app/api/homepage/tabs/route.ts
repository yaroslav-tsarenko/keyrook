import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const tabs = await prisma.homepageTab.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(tabs);
  } catch (error) {
    console.error("Error fetching tabs:", error);
    return NextResponse.json({ error: "Failed to fetch tabs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();

    const tab = await prisma.homepageTab.create({
      data: body,
    });

    return NextResponse.json(tab, { status: 201 });
  } catch (error) {
    console.error("Error creating tab:", error);
    return NextResponse.json({ error: "Failed to create tab" }, { status: 500 });
  }
}
