import { inflateRawSync } from "node:zlib";

function unzip(buffer: Buffer) {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      break;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    const dataStart = nameStart + nameLength + extraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : inflateRawSync(compressed);
    files.set(name, data);
    offset = dataStart + compressedSize;
  }
  return files;
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)));
}

function columnIndex(ref: string) {
  let index = 0;
  for (const char of ref) {
    if (char < "A" || char > "Z") {
      break;
    }
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}

function sharedStrings(xml: string) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml(
      [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((text) => text[1]).join(""),
    ),
  );
}

function sheetRows(xml: string, strings: string[]) {
  const rows: string[][] = [];
  for (const match of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cell of match[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(cell[1])?.[1] ?? "";
      const index = ref ? columnIndex(ref) : cells.length;
      const type = /t="([^"]+)"/.exec(cell[1])?.[1] ?? "";
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? "";
      const inline = [...cell[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((text) => text[1])
        .join("");
      let value = inline ? decodeXml(inline) : decodeXml(raw);
      if (type === "s" && value) {
        value = strings[Number(value)] ?? "";
      }
      cells[index] = value;
    }
    if (cells.some((cell) => cell?.trim())) {
      rows.push(cells.map((cell) => cell ?? ""));
    }
  }
  return rows;
}

export function readXlsxRows(buffer: Buffer) {
  const files = unzip(buffer);
  const sheet =
    files.get("xl/worksheets/sheet1.xml") ??
    [...files.entries()].find(([name]) => /xl\/worksheets\/sheet\d+\.xml/.test(name))?.[1];
  if (!sheet) {
    return [];
  }
  const strings = sharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  const rows = sheetRows(sheet.toString("utf8"), strings);
  if (rows.length < 2) {
    return [];
  }
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = (row[index] ?? "").trim();
      }
    });
    return record;
  });
}
