import "dotenv/config";
import fs from "node:fs";
import { syncCatalog, type CatalogSource } from "../src/lib/sih/sync";
import { sihGetItemsSchema } from "../src/lib/sih/types";
import { prisma } from "../src/lib/prisma";

function fixturePath(argv: string[]): string | null {
  const i = argv.indexOf("--fixture");
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith("--fixture="));
  if (eq) return eq.slice("--fixture=".length);
  return process.env.SIH_FIXTURE_FILE?.trim() || null;
}

function fixtureSource(file: string): CatalogSource {
  return async () => {
    const parsed = sihGetItemsSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf-8")));
    if (!parsed.success) throw new Error(`Fixture ${file} does not match the supplier catalogue shape`);
    return parsed.data;
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log("usage: tsx scripts/catalog-sync.ts [--fixture <get-items.json>]");
    return;
  }
  const file = fixturePath(argv);
  if (file && !fs.existsSync(file)) throw new Error(`Fixture file not found: ${file}`);
  const result = await syncCatalog(file ? { source: fixtureSource(file), label: "fixture" } : {});
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[catalog-sync] failed:", err instanceof Error ? err.message : err);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
