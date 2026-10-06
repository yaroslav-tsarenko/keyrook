import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PolicyLayout } from "@/components/layout/PolicyLayout/PolicyLayout";
import { pageMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  const page = await prisma.page.findUnique({ where: { slug } });
  return page && page.isActive ? page : null;
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  const text = plainText(page.content);
  return pageMetadata({ title: page.title, description: text || page.title, path: `/pages/${page.slug}`, type: "article" });
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const updated = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(page.updatedAt);

  return (
    <PolicyLayout title={page.title} lastUpdated={updated}>
      <div className="[overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: page.content }} />
    </PolicyLayout>
  );
}
