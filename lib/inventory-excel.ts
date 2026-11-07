import { prisma } from "@/lib/prisma";

function xmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
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
  "Category type",
  "Brand",
  "Type",
  "Year",
  "Controller",
  "Condition",
  "Location",
  "Stock",
  "Status",
  "Price (INR)",
  "Used machine",
  "Featured",
  "Description",
  "Photo URLs",
  "Updated at",
];

export async function buildInventoryExcel() {
  const machines = await prisma.machine.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true, kind: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  const rows = machines.map((machine) => {
    const price = machine.price != null ? Number(machine.price) : null;
    return [
      stringCell(machine.name),
      stringCell(machine.slug),
      stringCell(machine.category.name),
      stringCell(machine.category.kind === "SPARE" ? "Spare part" : "Machine"),
      stringCell(machine.brand),
      stringCell(machine.type),
      numberCell(machine.year),
      stringCell(machine.controller),
      stringCell(machine.condition),
      stringCell(machine.location),
      numberCell(machine.stock),
      stringCell(machine.status),
      numberCell(price),
      stringCell(machine.used ? "Yes" : "No"),
      stringCell(machine.featured ? "Yes" : "No"),
      stringCell(machine.description),
      stringCell(machine.images.map((image) => image.url).join("; ")),
      stringCell(machine.updatedAt.toISOString().slice(0, 19).replace("T", " ")),
    ].join("");
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
