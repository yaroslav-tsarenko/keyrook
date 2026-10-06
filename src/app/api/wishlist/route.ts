import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isNewArrival, newArrivalCutoff } from "@/lib/new-arrivals";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          omit: { metadata: true, costPrice: true },
          include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, item: { select: { title: true, productType: true, platform: true, region: true, edition: true, languages: true, genres: true, releaseYear: true, validity: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const newSince = await newArrivalCutoff();
    return NextResponse.json(items.map((item) => ({ ...item, product: { ...item.product, key: item.product.item, isNew: isNewArrival(item.product.createdAt, newSince) } })));
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { productId } = await request.json();

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed" });
    }

    const item = await prisma.wishlistItem.create({
      data: { userId: user.id, productId },
    });

    return NextResponse.json({ action: "added", item }, { status: 201 });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
