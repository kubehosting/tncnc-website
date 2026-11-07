import { mkdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("file:")) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
