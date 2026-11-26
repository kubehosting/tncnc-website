import { ensureDefaultAdmin } from "@/lib/ensure-admin";
import { prisma } from "@/lib/prisma";
import { allocateSuffixedSku, skuKey } from "@/lib/sku";
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
  try {
    await uniquifyMachineSkus();
    await ensureMachineSkuIndex();
  } catch (error) {
    console.error("Could not enforce unique machine SKUs.", error);
  }
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

async function uniquifyMachineSkus() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Machine")`);
  if (!columns.some((column) => column.name === "sku")) {
    return;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; sku: string }>>(
    `SELECT "id", "sku" FROM "Machine" WHERE "sku" IS NOT NULL AND trim("sku") != '' ORDER BY "createdAt" ASC, "id" ASC`,
  );
  const taken = new Set(rows.map((row) => skuKey(row.sku)));
  const claimed = new Set<string>();
  for (const row of rows) {
    const key = skuKey(row.sku);
    if (!claimed.has(key)) {
      claimed.add(key);
      continue;
    }
    const next = allocateSuffixedSku(row.sku, taken);
    taken.add(skuKey(next));
    await prisma.machine.update({ where: { id: row.id }, data: { sku: next } });
  }
}

async function ensureMachineSkuIndex() {
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Machine_sku_lower_trim_key" ON "Machine"(lower(trim("sku"))) WHERE "sku" IS NOT NULL AND trim("sku") != ''`,
  );
}

async function ensureCategoryColumns() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Category")`);
  const present = new Set(columns.map((column) => column.name));
  if (!present.has("showOnHome")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Category" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT true`,
    );
  }
  if (!present.has("subcategoriesJson")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN "subcategoriesJson" TEXT`);
  }
}
