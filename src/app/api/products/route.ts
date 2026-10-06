import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mentionsSupplier } from "@/lib/utils/supplier";
import { productSchema } from "@/lib/validators/product";
import { PRODUCTS_PER_PAGE } from "@/lib/utils/constants";
import { slugify } from "@/lib/utils/slugify";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, s-maxage=120",
  "Vercel-CDN-Cache-Control": "public, s-maxage=120",
};
const PRIVATE_CACHE_HEADERS = { "Cache-Control": "private, no-store" };

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = clampInt(searchParams.get("page"), 1, 1, 10000);
    const pageSize = clampInt(searchParams.get("pageSize"), PRODUCTS_PER_PAGE, 1, 100);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const featured = searchParams.get("featured");
    const brand = searchParams.get("brand") || "";
    const onSale = searchParams.get("onSale");

    const adminView = Boolean(status) && status !== "ACTIVE";
    if (adminView) {
      const admin = await requireAdmin();
      if (admin instanceof NextResponse) return admin;
    }

    if (status && !["ACTIVE", "DRAFT", "ARCHIVED", "ALL"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const where: Prisma.ProductWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumProductStatusFilter;
    } else if (!status) {
      where.status = "ACTIVE";
    }

    if (mentionsSupplier(search) || mentionsSupplier(brand)) {
      where.id = { in: [] };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        include: {
          children: {
            select: { slug: true, children: { select: { slug: true } } },
          },
        },
      });
      if (cat) {
        const slugs = [cat.slug];
        for (const child of cat.children) {
          slugs.push(child.slug);
          for (const grandchild of child.children) {
            slugs.push(grandchild.slug);
          }
        }
        where.categories = {
          some: { category: { slug: { in: slugs } } },
        };
      } else {
        where.categories = {
          some: { category: { slug: category } },
        };
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === "true") {
      where.quantity = { gt: 0 };
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (brand) {
      where.brand = brand;
    }

    if (onSale === "true") {
      where.comparePrice = { not: null };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sort) {
        case "price-asc": return { price: "asc" };
        case "price-desc": return { price: "desc" };
        case "name-asc": return { name: "asc" };
        default: return { createdAt: "desc" };
      }
    })();

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        omit: adminView ? { metadata: true } : { metadata: true, costPrice: true },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 2 },
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          skin: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: products,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      { headers: adminView ? PRIVATE_CACHE_HEADERS : PUBLIC_CACHE_HEADERS },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    const slug = slugify(validated.name);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        sku: validated.sku,
        description: validated.description,
        shortDescription: validated.shortDescription,
        price: validated.price,
        comparePrice: validated.comparePrice,
        costPrice: validated.costPrice,
        trackInventory: validated.trackInventory,
        quantity: validated.quantity,
        lowStockAlert: validated.lowStockAlert,
        weight: validated.weight,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        status: validated.status,
        isFeatured: validated.isFeatured,
        brand: validated.brand,
        gtin: validated.gtin,
        ean: validated.ean || undefined,
        mpn: validated.mpn,
        characteristics: validated.characteristics ?? undefined,
        googleCategory: validated.googleCategory,
        condition: validated.condition,
        categories: validated.categoryIds
          ? {
              create: validated.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
