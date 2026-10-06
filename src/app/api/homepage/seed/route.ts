import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { requireAdmin } from "@/lib/auth";

const PAINT = "#3B2620";
const RETIRED_SECTION_SLUGS = ["best-deals", "popular", "new-arrivals", "electronics", "recommended", "home-essentials", "all-products"];
const CHALK = "#F1F3F2";

async function removeStale<T extends { id: string }>(rows: T[], keep: Set<string>, remove: (ids: string[]) => Promise<unknown>) {
  const stale = rows.filter((r) => r.id.startsWith("seed-") && !keep.has(r.id)).map((r) => r.id);
  if (stale.length > 0) await remove(stale);
}

export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, description: true, _count: { select: { products: true } } },
    });
    const stocked = categories.filter((c) => c._count.products > 0);

    const utilityLinks = [
      { label: "Delivery via Steam", linkUrl: "/policies/shipping", icon: "Send", position: "left" },
      { label: "Refunds", linkUrl: "/policies/returns", icon: "RotateCcw", position: "left" },
      { label: "Item guarantee", linkUrl: "/policies/warranty", icon: "ShieldCheck", position: "left" },
      { label: "FAQ", linkUrl: "/faq", icon: "CircleHelp", position: "left" },
      { label: "About", linkUrl: "/about", icon: "Info", position: "right" },
      { label: "Contact us", linkUrl: "/contact", icon: "Mail", position: "right" },
    ].map((link, sortOrder) => ({ id: `seed-utility-${sortOrder}`, ...link, sortOrder }));

    const promoStripItems = [
      { icon: "Send", title: `Delivered by ${POLICY_FACTS.deliveryMethod}`, subtitle: `To your Steam account, ${POLICY_FACTS.deliveryUsual}`, linkUrl: "/policies/shipping" },
      { icon: "ShieldCheck", title: "Item guarantee", subtitle: `Refund if we cannot deliver within ${POLICY_FACTS.deliveryDeadlineHours} hours`, linkUrl: "/policies/warranty" },
      { icon: "CreditCard", title: "Card payments", subtitle: POLICY_FACTS.cardMethods, linkUrl: "/policies/payment" },
    ].map((item, sortOrder) => ({ id: `seed-promo-${sortOrder}`, ...item, sortOrder }));

    const tabs = stocked.map((c, sortOrder) => ({
      id: `seed-tab-${sortOrder}`,
      label: c.name,
      icon: null,
      linkUrl: `/catalog/${c.slug}`,
      color: PAINT,
      sortOrder,
    }));

    const banners = [
      ...stocked.slice(0, 3).map((c, sortOrder) => ({
        id: `seed-hero-${sortOrder}`,
        type: "HERO" as const,
        title: c.name,
        subtitle: null,
        description: c.description,
        linkUrl: `/catalog/${c.slug}`,
        ctaLabel: `Shop ${c.name.toLowerCase()}`,
        bgColor: PAINT,
        textColor: CHALK,
        badgeText: null,
        oldPrice: null,
        newPrice: null,
        discountText: null,
        sortOrder,
      })),
      ...stocked.slice(3, 6).map((c, sortOrder) => ({
        id: `seed-promo-small-${sortOrder}`,
        type: "PROMO_SMALL" as const,
        title: c.name,
        subtitle: null,
        description: null,
        linkUrl: `/catalog/${c.slug}`,
        ctaLabel: "View all",
        bgColor: CHALK,
        textColor: PAINT,
        badgeText: null,
        oldPrice: null,
        newPrice: null,
        discountText: null,
        sortOrder,
      })),
    ];

    const productBrands = await prisma.product.groupBy({
      by: ["brand"],
      where: { status: "ACTIVE", brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
    });
    const brands = productBrands
      .filter((b): b is typeof b & { brand: string } => Boolean(b.brand))
      .map((b, sortOrder) => ({
        id: `seed-brand-${sortOrder}`,
        name: b.brand,
        logoUrl: null,
        linkUrl: `/search?q=${encodeURIComponent(b.brand)}`,
        sortOrder,
      }));

    const sections = [
      { title: "New in the bay", subtitle: null, slug: "new-in-the-bay", filterType: "newest", categorySlug: null, viewAllUrl: "/catalog?sort=newest", viewAllLabel: "Newest first" },
      { title: "Reduced", subtitle: "Lowered prices, with the previous price shown beside each", slug: "reduced", filterType: "onSale", categorySlug: null, viewAllUrl: "/catalog?onSale=true", viewAllLabel: "See everything reduced" },
      ...stocked.slice(0, 4).map((c) => ({
        title: c.name,
        subtitle: c.description,
        slug: `category-${c.slug}`,
        filterType: "category",
        categorySlug: c.slug,
        viewAllUrl: `/catalog/${c.slug}`,
        viewAllLabel: `All ${c.name.toLowerCase()}`,
      })),
    ].map((section, sortOrder) => ({ ...section, maxProducts: 8, bgStyle: "white", columns: 4, sortOrder }));

    await prisma.$transaction(async (tx) => {
      for (const { id, ...data } of utilityLinks) {
        await tx.utilityLink.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const { id, ...data } of promoStripItems) {
        await tx.promoStripItem.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const { id, ...data } of tabs) {
        await tx.homepageTab.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const { id, ...data } of banners) {
        await tx.banner.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const { id, ...data } of brands) {
        await tx.brand.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
      for (const section of sections) {
        await tx.homepageSection.upsert({ where: { slug: section.slug }, update: section, create: section });
      }

      await tx.homepageSection.deleteMany({ where: { slug: { in: RETIRED_SECTION_SLUGS } } });
      await removeStale(await tx.utilityLink.findMany({ select: { id: true } }), new Set(utilityLinks.map((r) => r.id)), (ids) => tx.utilityLink.deleteMany({ where: { id: { in: ids } } }));
      await removeStale(await tx.promoStripItem.findMany({ select: { id: true } }), new Set(promoStripItems.map((r) => r.id)), (ids) => tx.promoStripItem.deleteMany({ where: { id: { in: ids } } }));
      await removeStale(await tx.homepageTab.findMany({ select: { id: true } }), new Set(tabs.map((r) => r.id)), (ids) => tx.homepageTab.deleteMany({ where: { id: { in: ids } } }));
      await removeStale(await tx.banner.findMany({ select: { id: true } }), new Set(banners.map((r) => r.id)), (ids) => tx.banner.deleteMany({ where: { id: { in: ids } } }));
      await removeStale(await tx.brand.findMany({ select: { id: true } }), new Set(brands.map((r) => r.id)), (ids) => tx.brand.deleteMany({ where: { id: { in: ids } } }));
    });

    return NextResponse.json({
      success: true,
      seeded: {
        utilityLinks: utilityLinks.length,
        promoStripItems: promoStripItems.length,
        tabs: tabs.length,
        banners: banners.length,
        brands: brands.length,
        sections: sections.length,
      },
    });
  } catch (error) {
    console.error("Error seeding homepage data:", error);
    return NextResponse.json({ error: "Failed to seed homepage data" }, { status: 500 });
  }
}
