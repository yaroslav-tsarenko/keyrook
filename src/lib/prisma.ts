import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sanitizeSupplierData } from "@/lib/utils/supplier";

// Serverless runtimes open a connection per invocation, so the pooled DATABASE_URL
// is the right one here; DIRECT_URL stays for migrations and the CLI scripts.
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL (or DIRECT_URL) must be set to reach Postgres.");
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return sanitizeSupplierData(await query(args));
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
