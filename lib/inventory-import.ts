export const inventoryImportHeaders = [
  "name",
  "slug",
  "categorySlug",
  "brand",
  "type",
  "year",
  "controller",
  "condition",
  "location",
  "stock",
  "status",
  "price",
  "used",
  "featured",
  "description",
  "imageUrls",
] as const;

const aliases: Record<string, string> = {
  name: "name",
  slug: "slug",
  "sku / slug": "slug",
  sku: "slug",
  categoryslug: "categorySlug",
  category: "category",
  "category type": "categoryType",
  brand: "brand",
  type: "type",
  year: "year",
  controller: "controller",
  condition: "condition",
  location: "location",
  stock: "stock",
  status: "status",
  price: "price",
  "price (inr)": "price",
  used: "used",
  "used machine": "used",
  featured: "featured",
  description: "description",
  imageurls: "imageUrls",
  "photo urls": "imageUrls",
};

function unescapeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }
  const headers = splitCsvLine(lines[0]).map((header) => header.replaceAll('"', ""));
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? "";
    });
    return row;
  });
}

function parseSpreadsheetMl(text: string) {
  const rowXml = [...text.matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/gi)].map((match) => match[1]);
  if (rowXml.length < 2) {
    return [];
  }
  const cellsOf = (row: string) =>
    [...row.matchAll(/<Data\b[^>]*>([\s\S]*?)<\/Data>/gi)].map((match) =>
      unescapeXml(match[1]).trim(),
    );
  const headers = cellsOf(rowXml[0]);
  return rowXml.slice(1).map((row) => {
    const cols = cellsOf(row);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cols[index] ?? "";
    });
    return record;
  });
}

export function parseInventoryFile(text: string, filename = "") {
  const lower = filename.toLowerCase();
  const looksXml =
    lower.endsWith(".xls") ||
    lower.endsWith(".xml") ||
    text.includes("urn:schemas-microsoft-com:office:spreadsheet");
  const raw = looksXml ? parseSpreadsheetMl(text) : parseCsv(text);
  return raw.map(normalizeImportRow).filter((row) => Boolean(row.name));
}

export function normalizeImportRow(input: Record<string, unknown>) {
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const mapped = aliases[key.trim().toLowerCase()];
    if (!mapped || value === undefined || value === null) {
      continue;
    }
    row[mapped] = String(value).trim();
  }
  return row;
}

export function inventoryTemplateCsv() {
  const sample = [
    "Mazak QT 250 Demo",
    "mazak-qt-250-demo",
    "cnc-turning",
    "Mazak",
    "CNC Turning Center",
    "2018",
    "Mazatrol",
    "Excellent",
    "Chennai, India",
    "1",
    "AVAILABLE",
    "1850000",
    "Yes",
    "No",
    "Verified turning center ready for production.",
    "",
  ];
  return `${inventoryImportHeaders.join(",")}\n${sample.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")}\n`;
}
