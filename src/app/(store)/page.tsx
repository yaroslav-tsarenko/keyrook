import "@/styles/home.css";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { getHomeData } from "@/components/home/data";
import { DoorHero } from "@/components/home/DoorHero";
import { SecurityStrip } from "@/components/home/SecurityStrip";
import { PlatformVault } from "@/components/home/PlatformVault";
import { PriceCuts } from "@/components/home/PriceCuts";
import { TheaterSection } from "@/components/home/TheaterSection";
import { GenreDirectory } from "@/components/home/GenreDirectory";
import { NewReleases } from "@/components/home/NewReleases";
import { Prepaid } from "@/components/home/Prepaid";
import { ActivationSelector } from "@/components/home/ActivationSelector";
import { SecurityLedger } from "@/components/home/SecurityLedger";
import { BudgetDial } from "@/components/home/BudgetDial";
import { HomeQuestions } from "@/components/home/HomeQuestions";
import { DoorOpen } from "@/components/home/DoorOpen";
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
      <DoorHero data={data} />
      <SecurityStrip />
      <PlatformVault platforms={data.platforms} />
      <PriceCuts deals={data.deals} />
      <TheaterSection />
      <GenreDirectory genres={data.genres} />
      <NewReleases releases={data.releases} />
      <Prepaid giftCards={data.giftCards} timetable={data.timetable} />
      <ActivationSelector platforms={data.activationPlatforms} />
      <SecurityLedger />
      <BudgetDial bands={data.bands} products={data.bandProducts} />
      <HomeQuestions />
      <DoorOpen data={data} />
    </div>
  );
}
