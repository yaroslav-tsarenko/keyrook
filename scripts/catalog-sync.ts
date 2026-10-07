import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { syncCatalog, liveSource, type CatalogSource } from "../src/lib/esa/sync";
import { refreshCatalog } from "../src/lib/esa/refresh";
import { parseProducts } from "../src/lib/esa/client";
import { catalogConfig } from "../src/config/catalog";
import { prisma } from "../src/lib/prisma";
import type { EsaProduct } from "../src/lib/esa/types";

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : null;
}

function fixtureSource(file: string): CatalogSource {
  const absolute = path.resolve(file);
  const pageSize = catalogConfig.sync.pageSize;
  if (absolute.endsWith(".ndjson")) {
    return {
      id: `fixture:${absolute}`,
      label: "fixture",
      kind: "stream",
      pages: async function* () {
        const lines = readline.createInterface({ input: fs.createReadStream(absolute, { encoding: "utf-8" }), crlfDelay: Infinity });
        let page: unknown[] = [];
        let rejected = 0;
        for await (const line of lines) {
          if (!line.trim()) continue;
          page.push(JSON.parse(line));
          if (page.length < pageSize) continue;
          const parsed = parseProducts(page);
          rejected += parsed.rejected;
          page = [];
          yield parsed.products;
        }
        if (page.length) {
          const parsed = parseProducts(page);
          rejected += parsed.rejected;
          yield parsed.products;
        }
        if (rejected) console.warn(`[catalog-sync] ${rejected} fixture rows did not match the product shape and were skipped`);
      },
    };
  }
  let cache: EsaProduct[] | null = null;
  const load = () => {
    if (cache) return cache;
    const raw = JSON.parse(fs.readFileSync(absolute, "utf-8")) as { results?: unknown[] } | unknown[];
    const parsed = parseProducts(Array.isArray(raw) ? raw : raw.results ?? []);
    if (parsed.rejected) console.warn(`[catalog-sync] ${parsed.rejected} fixture rows did not match the product shape and were skipped`);
    cache = parsed.products;
    return cache;
  };
  return {
    id: `fixture:${absolute}`,
    label: "fixture",
    kind: "paged",
    first: async () => ({ products: load().slice(0, pageSize), itemCount: load().length }),
    page: async (page) => load().slice((page - 1) * pageSize, page * pageSize),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log("usage: tsx scripts/catalog-sync.ts [--fixture <file>] [--max-pages <n>] [--fresh] [--keep-staging] [--refresh]");
    console.log("  default         page through the supplier catalogue (KINGUIN_API_KEY, KINGUIN_API_BASE) and rebuild the store catalogue");
    console.log(`                  pages are staged in ${catalogConfig.sync.stagingDir}; an interrupted run resumes where it stopped`);
    console.log("  --fixture       read products from a .json file shaped like the product list response, or a .ndjson file with one product per line");
    console.log(`  --max-pages     stop after n pages of ${catalogConfig.sync.pageSize} products (quick trial runs)`);
    console.log(`  --fresh         ignore staged pages from an interrupted run (they are kept up to ${catalogConfig.sync.resumeMaxAgeHours}h)`);
    console.log("  --keep-staging  keep the staged pages after a successful run");
    console.log("  --refresh       only re-check price and stock of products already listed");
    return;
  }
  if (argv.includes("--refresh")) {
    console.log(JSON.stringify(await refreshCatalog({ budgetMs: null, log: (line) => console.log(line) }), null, 2));
    return;
  }
  const file = flag(argv, "fixture") ?? process.env.CATALOG_FIXTURE_FILE?.trim() ?? null;
  const maxPages = flag(argv, "max-pages");
  if (file && !fs.existsSync(file)) throw new Error(`Fixture file not found: ${file}`);
  const source = file ? fixtureSource(file) : liveSource({ maxPages: maxPages ? Number(maxPages) : null });
  const result = await syncCatalog({ source, fresh: argv.includes("--fresh"), keepStaging: argv.includes("--keep-staging") });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[catalog-sync] failed:", err instanceof Error ? err.message : err);
    console.error("[catalog-sync] staged pages are kept; run the same command again to resume");
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
