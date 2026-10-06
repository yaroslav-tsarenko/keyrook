import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { getHomeData } from "@/components/home/data";
import { HomeHero } from "@/components/home/HomeHero";
import { WeaponBays } from "@/components/home/WeaponBays";
import { Spotlight } from "@/components/home/Spotlight";
import { PriceBands } from "@/components/home/PriceBands";
import { RarityLadder } from "@/components/home/RarityLadder";
import { WearWalk } from "@/components/home/WearWalk";
import { MarksSplit } from "@/components/home/MarksSplit";
import { ProductRail } from "@/components/home/ProductRail";
import { HomeDelivery } from "@/components/home/HomeDelivery";
import { HomeQuestions } from "@/components/home/HomeQuestions";
import { RecentlyViewed } from "@/components/skin/RecentlyViewed";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { POLICY_FACTS } from "@/lib/policy-facts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  const title = t("metaTitle", { brand: BRAND.name });
  const description = t("metaDescription", { brand: BRAND.name, method: POLICY_FACTS.deliveryMethod });
  return pageMetadata({ title, description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div data-landing="home">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeHero liveCount={data.totalProducts} hero={data.hero} />
      <WeaponBays types={data.types} />
      <Spotlight knives={data.knives} gloves={data.gloves} />
      <RarityLadder tiers={data.rarities} />
      <PriceBands bands={data.bands} />
      <WearWalk wear={data.wear} skin={data.wearSkin} />
      <MarksSplit stattrak={data.stattrak} souvenir={data.souvenir} />
      <div className="mx-auto max-w-wide px-gutter">
        <ProductRail
          id="new-in"
          title="New in the bay"
          lead="The latest skins added to the catalogue."
          products={data.newest}
          link={{ href: "/catalog?sort=newest", label: "Recently added" }}
          className="border-t border-line pb-20 pt-16"
        />
        <ProductRail
          id="price-drops"
          title="Price drops"
          lead="These skins cost less than when they were first listed. The earlier price is shown next to the current one."
          products={data.drops}
          showCompare
          className="border-t border-line pb-20 pt-16"
        />
        <RecentlyViewed className="border-t border-line pb-20 pt-16" />
      </div>
      <HomeDelivery />
      <HomeQuestions />
    </div>
  );
}
