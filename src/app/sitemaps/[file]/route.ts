import { categoryEntries, productEntries, productSitemapCount, staticPageEntries, urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

async function entriesFor(file: string): Promise<SitemapEntry[] | null> {
  if (file === "pages.xml") return staticPageEntries();
  if (file === "categories.xml") return categoryEntries();
  const match = /^products-(\d{1,4})\.xml$/.exec(file);
  if (!match) return null;
  const chunk = Number(match[1]) - 1;
  if (chunk < 0 || chunk >= (await productSitemapCount())) return null;
  return productEntries(chunk);
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  try {
    const entries = await entriesFor(file);
    if (!entries) return new Response("Not found", { status: 404 });
    return xmlResponse(urlsetXml(entries));
  } catch (error) {
    console.error(`Error generating sitemap ${file}:`, error);
    return new Response("Sitemap unavailable", { status: 503, headers: { "Retry-After": "300" } });
  }
}
