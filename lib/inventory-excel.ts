import { ensureDatabase } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

function xmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "");
}

function stringCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlText(String(value))}</Data></Cell>`;
}

function numberCell(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
}

const headers = [
  "Name",
  "SKU / Slug",
  "Category",
  "Subcategory",
  "Child category",
  "SKU",
  "Category type",
  "Brand",
  "Type",
  "Year",
  "Controller",
  "Condition",
  "Location",
  "Stock",
  "Status",
  "Previous price (INR)",
  "Price (INR)",
  "Used machine",
  "Featured",
  "Description",
  "Photo URLs",
  "Updated at",
];

type ExportMachine = {
  name: string;
  slug: string;
  categoryId: string;
  subcategory: string | null;
  childCategory: string | null;
  sku: string | null;
  brand: string | null;
  type: string | null;
  year: number | null;
  controller: string | null;
  condition: string | null;
  location: string | null;
  stock: number | null;
  status: string | null;
  price: unknown;
  previousPrice: unknown;
  used: boolean;
  featured: boolean;
  description: string | null;
  updatedAt: Date | null;
  images: { url: string }[];
};

type ExportCategory = { id: string; name: string; kind: string; sortOrder: number };

type RawRow = Record<string, unknown>;

function rawString(row: RawRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? null : String(value);
}

function rawNumber(row: RawRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rawBoolean(row: RawRow, key: string) {
  const value = row[key];
  if (typeof value === "number" || typeof value === "bigint") {
    return Number(value) === 1;
  }
  return value === true || value === "1" || value === "true";
}

function rawDate(row: RawRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  const date =
    typeof value === "number" || typeof value === "bigint"
      ? new Date(Number(value))
      : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function loadWithPrisma(): Promise<[ExportMachine[], ExportCategory[]]> {
  const [machines, categories] = await Promise.all([
    prisma.machine.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true, kind: true, sortOrder: true } }),
  ]);
  return [machines, categories];
}

// Reads whatever columns the live table has, so an older database still exports.
async function loadWithRawSql(): Promise<[ExportMachine[], ExportCategory[]]> {
  const [machineRows, categoryRows, imageRows] = await Promise.all([
    prisma.$queryRawUnsafe<RawRow[]>(`SELECT * FROM "Machine"`),
    prisma.$queryRawUnsafe<RawRow[]>(`SELECT * FROM "Category"`),
    prisma.$queryRawUnsafe<RawRow[]>(`SELECT * FROM "MachineImage"`).catch(() => [] as RawRow[]),
  ]);

  const imagesByMachine = new Map<string, { url: string; sortOrder: number }[]>();
  for (const row of imageRows) {
    const machineId = rawString(row, "machineId");
    const url = rawString(row, "url");
    if (!machineId || !url) {
      continue;
    }
    const list = imagesByMachine.get(machineId) ?? [];
    list.push({ url, sortOrder: rawNumber(row, "sortOrder") ?? 0 });
    imagesByMachine.set(machineId, list);
  }

  const machines = machineRows
    .filter((row) => row.deletedAt === null || row.deletedAt === undefined)
    .map((row): ExportMachine => {
      const id = rawString(row, "id") ?? "";
      return {
        name: rawString(row, "name") ?? "",
        slug: rawString(row, "slug") ?? "",
        categoryId: rawString(row, "categoryId") ?? "",
        subcategory: rawString(row, "subcategory"),
        childCategory: rawString(row, "childCategory"),
        sku: rawString(row, "sku"),
        brand: rawString(row, "brand"),
        type: rawString(row, "type"),
        year: rawNumber(row, "year"),
        controller: rawString(row, "controller"),
        condition: rawString(row, "condition"),
        location: rawString(row, "location"),
        stock: rawNumber(row, "stock"),
        status: rawString(row, "status"),
        price: rawNumber(row, "price"),
        previousPrice: rawNumber(row, "previousPrice"),
        used: rawBoolean(row, "used"),
        featured: rawBoolean(row, "featured"),
        description: rawString(row, "description"),
        updatedAt: rawDate(row, "updatedAt"),
        images: (imagesByMachine.get(id) ?? [])
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map(({ url }) => ({ url })),
      };
    });

  const categories = categoryRows.map((row) => ({
    id: rawString(row, "id") ?? "",
    name: rawString(row, "name") ?? "",
    kind: rawString(row, "kind") ?? "MACHINE",
    sortOrder: rawNumber(row, "sortOrder") ?? 0,
  }));

  return [machines, categories];
}

export async function buildInventoryExcel() {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("Could not prepare the database before export.", error);
  }

  let machines: ExportMachine[];
  let categories: ExportCategory[];
  try {
    [machines, categories] = await loadWithPrisma();
  } catch (error) {
    console.error("Inventory export query failed; reading tables directly.", error);
    [machines, categories] = await loadWithRawSql();
  }
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sorted = [...machines].sort((left, right) => {
    const leftCategory = categoryById.get(left.categoryId);
    const rightCategory = categoryById.get(right.categoryId);
    const categoryOrder = (leftCategory?.sortOrder ?? 9999) - (rightCategory?.sortOrder ?? 9999);
    if (categoryOrder !== 0) {
      return categoryOrder;
    }
    return left.name.localeCompare(right.name);
  });

  const rows = sorted.flatMap((machine) => {
    try {
      const category = categoryById.get(machine.categoryId);
      const price = machine.price != null ? Number(machine.price) : null;
      const previousPrice = machine.previousPrice != null ? Number(machine.previousPrice) : null;
      const updated =
        machine.updatedAt instanceof Date && !Number.isNaN(machine.updatedAt.getTime())
          ? machine.updatedAt.toISOString().slice(0, 19).replace("T", " ")
          : "";
      return [[
        stringCell(machine.name),
        stringCell(machine.slug),
        stringCell(category?.name ?? ""),
        stringCell(machine.subcategory),
        stringCell(machine.childCategory),
        stringCell(machine.sku),
        stringCell(category?.kind === "SPARE" ? "Spare part" : "Machine"),
        stringCell(machine.brand),
        stringCell(machine.type),
        numberCell(machine.year),
        stringCell(machine.controller),
        stringCell(machine.condition),
        stringCell(machine.location),
        numberCell(machine.stock),
        stringCell(machine.status),
        numberCell(Number.isFinite(previousPrice) ? previousPrice : null),
        numberCell(Number.isFinite(price) ? price : null),
        stringCell(machine.used ? "Yes" : "No"),
        stringCell(machine.featured ? "Yes" : "No"),
        stringCell(machine.description),
        stringCell(machine.images.map((image) => image.url).join("; ")),
        stringCell(updated),
      ].join("")];
    } catch (error) {
      console.error(`Skipped ${machine.name} during inventory export.`, error);
      return [];
    }
  });

  const headerRow = headers.map((header) => stringCell(header)).join("");
  const stamp = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0B1C36" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Inventory">
  <Table>
   <Row ss:StyleID="header">${headerRow}</Row>
   ${rows.map((row) => `<Row>${row}</Row>`).join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;

  return {
    filename: `TNCNC-inventory-${stamp}.xls`,
    body: Buffer.from(xml, "utf8"),
  };
}
