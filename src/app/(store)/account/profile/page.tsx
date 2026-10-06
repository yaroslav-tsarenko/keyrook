import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/account/ProfileForm/ProfileForm";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("profile"), t("description"), "/account/profile", false);
}

export default function ProfilePage() {
  return <ProfileForm />;
}
