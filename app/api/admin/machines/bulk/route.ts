import { asInt, jsonError, jsonOk, readJson, slugify } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { parseInventoryUpload, normalizeImportRow } from "@/lib/inventory-import";
import { machineCreateInput, machineUpdateInput, replaceImages } from "@/lib/machines-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function truthy(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["0", "false", "no", "n"].includes(normalized)) {
      return false;
    }
    return ["1", "true", "yes", "y"].includes(normalized);
  }
  return fallback;
}

async function categoryCatalog() {
  const categories = await prisma.category.findMany();
  return {
    bySlug: new Map(categories.map((category) => [category.slug, category])),
    byName: new Map(categories.map((category) => [category.name.toLowerCase(), category])),
  };
}

async function resolveCategory(
  row: Record<string, string>,
  catalog: Awaited<ReturnType<typeof categoryCatalog>>,
) {
  const name = row.category?.trim();
  const slug = row.categorySlug?.trim() || (name ? slugify(name) : "");
  const existing =
    (slug ? catalog.bySlug.get(slug) : undefined) ||
    (name ? catalog.byName.get(name.toLowerCase()) : undefined);
  if (existing) {
    return existing;
  }
  if (!name || !slug) {
    return null;
  }
  const created = await prisma.category.create({
    data: {
      name,
      slug,
      kind: row.categoryKind === "MACHINE" ? "MACHINE" : "SPARE",
      sortOrder: 200,
      description: name,
    },
  });
  catalog.bySlug.set(created.slug, created);
  catalog.byName.set(created.name.toLowerCase(), created);
  return created;
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  let rows: Record<string, string>[] = [];
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Choose a CSV or Excel file");
    }
    rows = parseInventoryUpload(Buffer.from(await file.arrayBuffer()), file.name);
  } else {
    const parsed = await readJson(request);
    if ("error" in parsed) {
      return parsed.error;
    }
    if (!Array.isArray(parsed.data.rows)) {
      return jsonError("Upload a CSV/Excel file, or send a rows array");
    }
    rows = (parsed.data.rows as Record<string, unknown>[])
      .map(normalizeImportRow)
      .filter((row) => Boolean(row.name));
  }

  if (rows.length === 0) {
    return jsonError(
      "No product rows found. Upload the .xlsx product download, with columns name, sku, and category_name.",
    );
  }

  const created: string[] = [];
  const updated: string[] = [];
  const errors: string[] = [];

  const catalog = await categoryCatalog();

  for (const [index, row] of rows.entries()) {
    const category = await resolveCategory(row, catalog);
    if (!category) {
      errors.push(`Row ${index + 1}: unknown category (use categorySlug like vmc or cnc-lathe)`);
      continue;
    }

    const name = row.name?.trim();
    const slug = row.slug?.trim() || (name ? `${slugify(name)}-${index + 1}` : "");
    const imageUrls = row.imageUrls
      ? row.imageUrls.split(/[;|]/).map((url) => url.trim()).filter(Boolean)
      : [];
    const body = {
      name,
      categoryId: category.id,
      slug,
      brand: row.brand || undefined,
      type: row.type || undefined,
      year: row.year || undefined,
      controller: row.controller || undefined,
      condition: row.condition || undefined,
      location: row.location || undefined,
      stock: asInt(row.stock) ?? 1,
      status: row.status || "AVAILABLE",
      price: row.price || undefined,
      previousPrice: row.previousPrice || null,
      sku: row.sku || undefined,
      subcategory: row.subcategory || undefined,
      childCategory: row.childCategory || undefined,
      used: truthy(row.used, true),
      featured: truthy(row.featured, false),
      description: row.description || undefined,
    };

    const existing = slug
      ? await prisma.machine.findUnique({ where: { slug } })
      : null;

    try {
      if (existing) {
        const prepared = machineUpdateInput(body);
        if ("error" in prepared) {
          errors.push(`Row ${index + 1}: could not update ${name}`);
          continue;
        }
        await prisma.machine.update({ where: { id: existing.id }, data: prepared.data });
        if (imageUrls.length) {
          await replaceImages(existing.id, imageUrls, name ?? existing.name);
        }
        updated.push(name ?? slug);
      } else {
        const prepared = machineCreateInput(body);
        if ("error" in prepared) {
          errors.push(`Row ${index + 1}: could not import ${name ?? "item"}`);
          continue;
        }
        const machine = await prisma.machine.create({ data: prepared.data });
        if (imageUrls.length) {
          await replaceImages(machine.id, imageUrls, machine.name);
        }
        created.push(machine.name);
      }
    } catch {
      errors.push(`Row ${index + 1}: ${name ?? "item"} failed`);
    }
  }

  return jsonOk({
    created: created.length,
    updated: updated.length,
    names: [...created, ...updated],
    errors,
  });
}
