import { ensureDefaultAdmin } from "@/lib/ensure-admin";
import { prisma } from "@/lib/prisma";
import { sqliteSchemaStatements } from "@/lib/sqlite-schema";

let ready: Promise<void> | null = null;

export function ensureDatabase() {
  if (!ready) {
    ready = applySchema().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function applySchema() {
  try {
    await prisma.adminUser.count();
  } catch {
    for (const statement of sqliteSchemaStatements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }

  try {
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("Could not create the default admin user.", error);
  }
}
