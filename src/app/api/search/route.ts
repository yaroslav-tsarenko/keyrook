import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mentionsSupplier } from "@/lib/utils/supplier";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const requested = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 10;

    if (!query || query.length < 2 || mentionsSupplier(query)) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
