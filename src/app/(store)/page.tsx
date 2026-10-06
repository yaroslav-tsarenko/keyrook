import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { getHomeData } from "@/components/home/data";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeIndex } from "@/components/home/HomeIndex";
import { PriceBands } from "@/components/home/PriceBands";
import { ProductRail } from "@/components/home/ProductRail";
import { HomeDelivery } from "@/components/home/HomeDelivery";
import { HomeQuestions } from "@/components/home/HomeQuestions";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return pageMetadata({ title: t("metaTitle", { brand: BRAND.name }), description: t("metaDescription", { brand: BRAND.name }), path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div data-landing="home">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeHero liveCount={data.totalProducts} hero={data.hero} />
      <div className="mx-auto max-w-wide px-gutter">
        <ProductRail id="new-releases" title="Recent releases" lead="Games released most recently, one listing per title at its lowest price." products={data.releases} link={{ href: "/catalog/games?sort=release-desc", label: "All games by release date" }} className="border-t border-line pb-20 pt-16" />
      </div>
      <HomeIndex types={data.types} platforms={data.platforms} />
      <PriceBands bands={data.bands} />
      <div className="mx-auto max-w-wide px-gutter">
        <ProductRail id="prepaid" title="Subscriptions and gift cards" lead="Check the region on each card: it only adds balance to an account set to that region." products={data.prepaid} link={{ href: "/catalog/gift-cards", label: "All gift cards" }} className="border-t border-line pb-20 pt-16" />
        <ProductRail id="price-drops" title="Price drops" lead="At least 10% below the lowest price of the previous 30 days. That earlier price is shown struck through." products={data.drops} showCompare className="border-t border-line pb-20 pt-16" />
        <ProductRail id="new-in" title="Recently added" lead="The latest products added to the catalogue." products={data.newest} link={{ href: "/catalog?sort=newest", label: "Recently added" }} className="border-t border-line pb-20 pt-16" />
        <RecentlyViewed className="border-t border-line pb-20 pt-16" />
      </div>
      <HomeDelivery />
      <HomeQuestions />
    </div>
  );
}
