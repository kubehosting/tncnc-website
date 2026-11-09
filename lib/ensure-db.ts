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

  await ensureMachineColumns();
  await ensureCategoryColumns();

  try {
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("Could not create the default admin user.", error);
  }
}

async function ensureMachineColumns() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Machine")`);
  const present = new Set(columns.map((column) => column.name));
  const additions: Array<[string, string]> = [
    ["previousPrice", "DECIMAL"],
    ["sku", "TEXT"],
    ["subcategory", "TEXT"],
    ["childCategory", "TEXT"],
    ["deletedAt", "DATETIME"],
  ];
  for (const [name, type] of additions) {
    if (present.has(name)) {
      continue;
    }
    await prisma.$executeRawUnsafe(`ALTER TABLE "Machine" ADD COLUMN "${name}" ${type}`);
  }
}

async function ensureCategoryColumns() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Category")`);
  if (!columns.some((column) => column.name === "showOnHome")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Category" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT true`,
    );
  }
}
