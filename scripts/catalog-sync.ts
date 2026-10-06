import "dotenv/config";
import fs from "node:fs";
import { syncCatalog, fetchAllProducts, type CatalogSource } from "../src/lib/esa/sync";
import { refreshCatalog } from "../src/lib/esa/refresh";
import { parseProducts } from "../src/lib/esa/client";
import { prisma } from "../src/lib/prisma";

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : null;
}

function fixtureSource(file: string): CatalogSource {
  return async () => {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as { results?: unknown[] } | unknown[];
    const list = Array.isArray(raw) ? raw : raw.results ?? [];
    const { products, rejected } = parseProducts(list);
    if (rejected) console.warn(`[catalog-sync] ${rejected} fixture rows did not match the product shape and were skipped`);
    return products;
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log("usage: tsx scripts/catalog-sync.ts [--fixture <products.json>] [--max-pages <n>] [--refresh]");
    console.log("  default      page through the supplier catalogue (KINGUIN_API_KEY, KINGUIN_API_BASE) and rebuild the store catalogue");
    console.log("  --fixture    read products from a JSON file shaped like the product list response instead of the API");
    console.log("  --max-pages  stop after n pages of 100 products (quick trial runs)");
    console.log("  --refresh    only re-check price and stock of products already listed");
    return;
  }
  if (argv.includes("--refresh")) {
    console.log(JSON.stringify(await refreshCatalog(), null, 2));
    return;
  }
  const file = flag(argv, "fixture") ?? process.env.CATALOG_FIXTURE_FILE?.trim() ?? null;
  const maxPages = flag(argv, "max-pages");
  if (file && !fs.existsSync(file)) throw new Error(`Fixture file not found: ${file}`);
  const source: CatalogSource | undefined = file
    ? fixtureSource(file)
    : () =>
        fetchAllProducts({
          maxPages: maxPages ? Number(maxPages) : null,
          onPage: (page, total) => {
            if (page === 1 || page % 25 === 0 || page === total) console.log(`[catalog-sync] page ${page}/${total}`);
          },
        });
  const result = await syncCatalog({ source, label: file ? "fixture" : "live" });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[catalog-sync] failed:", err instanceof Error ? err.message : err);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
