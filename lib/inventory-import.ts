import { readXlsxRows } from "@/lib/xlsx-table";

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
  photo: "imageUrls",
  image: "imageUrls",
  details: "description",
  detail: "description",
  category_name: "category",
  "category name": "category",
  subcategory_name: "subcategory",
  "subcategory name": "subcategory",
  childcategory_name: "childCategory",
  "child category": "childCategory",
  product_type: "productType",
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

const machineCategories = new Set([
  "cnc machinery",
  "conventional machinery",
  "grinding machinery",
  "fabrication machinery",
  "material handling equipment's",
  "material handling equipments",
  "4th axis rotary table",
]);

function cleanPrice(value: string) {
  const amount = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 2) {
    return "";
  }
  return String(Math.round(amount * 100) / 100);
}

function cleanStock(value: string) {
  if (!value.trim()) {
    return "1";
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return "1";
  }
  return String(Math.round(amount));
}

function productPhoto(value: string) {
  const photo = value.trim();
  if (!photo || photo === "noimage.png" || photo.endsWith(".php")) {
    return "";
  }
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/products/${photo}`;
}

function applyDetailFields(row: Record<string, string>) {
  const description = row.description ?? "";
  if (!description) {
    return;
  }
  const labels: Record<string, keyof typeof row> = {
    manufacturer: "brand",
    controller: "controller",
    "year of mfg": "year",
    "year of manufacture": "year",
    location: "location",
    condition: "condition",
  };
  for (const line of description.split(/\r?\n/)) {
    const match = /^([^:]{2,40}):\s*(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const field = labels[match[1].trim().toLowerCase()];
    const value = match[2].trim();
    if (!field || !value || row[field]) {
      continue;
    }
    if (field === "year") {
      const year = /(\d{4})/.exec(value)?.[1];
      if (year) {
        row.year = year;
      }
      continue;
    }
    row[field] = value;
  }
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

export function parseInventoryUpload(data: Buffer, filename = "") {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx") || (data.length > 2 && data[0] === 0x50 && data[1] === 0x4b)) {
    return readXlsxRows(data).map(normalizeImportRow).filter((row) => Boolean(row.name));
  }
  return parseInventoryFile(data.toString("utf8"), filename);
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
  if (!row.type) {
    row.type = [row.subcategory, row.childCategory].filter(Boolean).join(" · ");
  }
  const categoryName = row.category?.trim().toLowerCase() ?? "";
  row.categoryKind = machineCategories.has(categoryName) ? "MACHINE" : "SPARE";
  if (row.price) {
    row.price = cleanPrice(row.price);
  }
  row.stock = cleanStock(row.stock ?? "");
  if (row.imageUrls) {
    row.imageUrls = productPhoto(row.imageUrls);
  }
  const usedText = `${row.name ?? ""} ${row.condition ?? ""} ${row.description ?? ""}`;
  if (!row.used) {
    row.used = /used/i.test(usedText) || row.categoryKind === "MACHINE" ? "Yes" : "No";
  }
  applyDetailFields(row);
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
