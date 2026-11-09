import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/pjpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const allowedExtension = new Map([
  ["jpg", "jpg"],
  ["jpeg", "jpeg"],
  ["png", "png"],
  ["webp", "webp"],
  ["gif", "gif"],
]);

const maxBytes = 5 * 1024 * 1024;

export const imageAccept =
  ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

function imageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  const named = allowedExtension.get(fromName);
  if (named && (allowedMime.has(file.type) || file.type === "" || file.type === "application/octet-stream")) {
    return named;
  }
  return allowedMime.get(file.type);
}

export async function saveInventoryImage(file: File) {
  const ext = imageExtension(file);
  if (!ext) {
    throw new Error("Only JPG, JPEG, PNG, WEBP, and GIF images are allowed");
  }
  if (file.size > maxBytes) {
    throw new Error("Each image must be 5MB or smaller");
  }

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataDir = path.join(process.cwd(), "data", "uploads", "inventory");
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, filename), bytes);
  try {
    const publicDir = path.join(process.cwd(), "public", "uploads", "inventory");
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, filename), bytes);
  } catch {
    // The public folder is not always the folder the web server exposes.
  }
  return `/api/media/inventory/${filename}`;
}
