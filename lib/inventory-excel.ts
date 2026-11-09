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

export async function buildInventoryExcel() {
  await ensureDatabase();
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
