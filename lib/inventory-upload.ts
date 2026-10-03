import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const maxBytes = 5 * 1024 * 1024;

export async function saveInventoryImage(file: File) {
  const ext = allowed.get(file.type);
  if (!ext) {
    throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
  }
  if (file.size > maxBytes) {
    throw new Error("Each image must be 5MB or smaller");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "inventory");
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/inventory/${filename}`;
}
