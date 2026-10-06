import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/utils/slugify";
import { requireAdmin } from "@/lib/auth";
import { categoryCounts, getCategoryTree } from "@/components/catalog/catalog-query";

const CATEGORIES_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, s-maxage=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=600",
};
const PRIVATE_CACHE_HEADERS = { "Cache-Control": "private, no-store" };

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get("flat") === "true";
    const includeEmpty = searchParams.get("includeEmpty") === "true";

    if (flat || includeEmpty) {
      const admin = await requireAdmin();
      if (admin instanceof NextResponse) return admin;
    }

    if (flat) {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      });
      return NextResponse.json(categories, { headers: PRIVATE_CACHE_HEADERS });
    }

    const active = includeEmpty ? {} : { isActive: true };
    const categories = await prisma.category.findMany({
      where: { parentId: null, ...active },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
        children: {
          where: active,
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            _count: { select: { products: true } },
            children: {
              where: active,
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              include: {
                _count: { select: { products: true } },
              },
            },
          },
        },
      },
    });

    if (includeEmpty) {
      return NextResponse.json(categories, { headers: PRIVATE_CACHE_HEADERS });
    }

    const counts = await categoryCounts(await getCategoryTree());

    type CountedNode = { id: string; children?: CountedNode[] };

    function withCounts<T extends CountedNode>(cats: T[]): (T & { productCount: number })[] {
      return cats
        .map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0, children: c.children ? withCounts(c.children) : [] }))
        .filter((c) => c.productCount > 0);
    }

    return NextResponse.json(withCounts(categories), {
      headers: CATEGORIES_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();
    const validated = categorySchema.parse(body);

    const slug = validated.parentId
      ? await (async () => {
          const parent = await prisma.category.findUnique({ where: { id: validated.parentId! }, select: { slug: true } });
          return parent ? slugify(`${parent.slug}-${validated.name}`) : slugify(validated.name);
        })()
      : slugify(validated.name);

    const category = await prisma.category.create({
      data: { ...validated, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
