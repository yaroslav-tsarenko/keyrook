import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ENV_FILE = path.join(ROOT, ".env");
const DB_NAME = process.env.LOCAL_DB_NAME || "keyrook";

function readEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const out = {};
  for (const raw of fs.readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

function writeEnvValue(key, value) {
  const lines = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf-8").split("\n") : [];
  const index = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
  if (index === -1) lines.unshift(`${key}=${value}`);
  else lines[index] = `${key}=${value}`;
  fs.writeFileSync(ENV_FILE, lines.join("\n"));
}

function run(command, args, extraEnv = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...extraEnv } });
  if (result.status !== 0) {
    console.error(`\n✗ ${command} ${args.join(" ")} failed`);
    process.exit(result.status ?? 1);
  }
}

async function ensureDatabase(adminUrl) {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
  } catch (error) {
    console.error(`\n✗ Cannot connect to local Postgres at ${adminUrl.replace(/:[^:@/]+@/, ":***@")}`);
    console.error(`  ${error.message}`);
    console.error("  Start Postgres (Postgres.app or `brew services start postgresql@16`) or set LOCAL_PG_URL, e.g.");
    console.error("  LOCAL_PG_URL=postgresql://postgres:postgres@localhost:5432 npm run local:setup");
    process.exit(1);
  }
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
  if (!exists.rowCount) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`✓ Created database ${DB_NAME}`);
  } else {
    console.log(`✓ Database ${DB_NAME} already exists`);
  }
  await client.end();
}

async function main() {
  const env = readEnv();
  const fixture = process.env.CATALOG_FIXTURE_FILE || env.CATALOG_FIXTURE_FILE || "";
  const hasSupplierKey = Boolean(process.env.KINGUIN_API_KEY || env.KINGUIN_API_KEY);

  let dbUrl = env.DIRECT_URL || env.DATABASE_URL;
  if (!dbUrl) {
    const base = (process.env.LOCAL_PG_URL || `postgresql://${os.userInfo().username}@localhost:5432`).replace(/\/+$/, "");
    await ensureDatabase(`${base}/postgres`);
    dbUrl = `${base}/${DB_NAME}`;
    writeEnvValue("DATABASE_URL", dbUrl);
    writeEnvValue("DIRECT_URL", dbUrl);
    console.log(`✓ .env now points DATABASE_URL and DIRECT_URL at ${dbUrl.replace(/:[^:@/]+@/, ":***@")}`);
  } else {
    console.log(`✓ Using the database already set in .env (${dbUrl.replace(/:[^:@/]+@/, ":***@")})`);
  }

  const dbEnv = { DATABASE_URL: dbUrl, DIRECT_URL: dbUrl };
  run("npx", ["prisma", "db", "push"], dbEnv);
  run("npx", ["prisma", "db", "seed"], dbEnv);

  if (hasSupplierKey || fixture) {
    run("npx", ["tsx", "scripts/catalog-sync.ts", ...(fixture && !hasSupplierKey ? ["--fixture", fixture] : []), ...process.argv.slice(2)], dbEnv);
  } else {
    console.log("\n! Catalogue not synced: set KINGUIN_API_KEY in .env (or CATALOG_FIXTURE_FILE for a local test file), then run: npm run catalog:sync");
  }

  if (!process.env.KEY_ENCRYPTION_SECRET && !env.KEY_ENCRYPTION_SECRET) {
    writeEnvValue("KEY_ENCRYPTION_SECRET", crypto.randomBytes(32).toString("base64url"));
    console.log("✓ Generated KEY_ENCRYPTION_SECRET in .env (keep it: delivered keys cannot be decrypted without it)");
  }

  console.log("\n✓ Done. Start the store with: npm run dev  →  http://localhost:3000");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
