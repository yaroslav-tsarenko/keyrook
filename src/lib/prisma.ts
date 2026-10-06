import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sanitizeSupplierData } from "@/lib/utils/supplier";

const connectionString =
  process.env.DIRECT_URL ||
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

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
