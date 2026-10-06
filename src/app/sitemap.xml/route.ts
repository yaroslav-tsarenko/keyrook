import { sitemapIndexEntries, sitemapIndexXml, xmlResponse } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return xmlResponse(sitemapIndexXml(await sitemapIndexEntries()));
  } catch (error) {
    console.error("Error generating sitemap index:", error);
    return new Response("Sitemap unavailable", { status: 503, headers: { "Retry-After": "300" } });
  }
}
