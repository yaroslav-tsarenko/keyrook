import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { BRAND } from "../src/lib/brand";
import { COMPANY } from "../src/lib/company";
import { STORE_POLICY } from "../src/config/store-policy";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const settings = {
    name: BRAND.name,
    description: BRAND.tagline,
    email: COMPANY.email,
    phone: COMPANY.phone,
    address: COMPANY.registeredOffice,
    currency: STORE_POLICY.currency,
    taxRate: STORE_POLICY.vatRegistered ? STORE_POLICY.tax.vatRatePercent : 0,
    freeShippingMin: null,
  };
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: settings,
    create: { id: "default", ...settings },
  });
  console.log("Store settings:", storeSettings.name);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log("No admin created: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one.");
    return;
  }
  if (adminPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: { email: adminEmail, passwordHash, name: `${BRAND.name} admin`, role: "ADMIN" },
  });
  console.log(`Admin user: ${admin.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
