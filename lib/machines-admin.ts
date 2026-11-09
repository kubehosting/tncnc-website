import { MachineStatus, Prisma } from "@prisma/client";
import {
  asBool,
  asDecimal,
  asInt,
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
  slugify,
} from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const machineInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.MachineInclude;

const statuses = new Set<string>(Object.values(MachineStatus));

export function asMachineStatus(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  return statuses.has(normalized) ? (normalized as MachineStatus) : undefined;
}

export async function replaceImages(
  machineId: string,
  images: unknown,
  fallbackAlt: string,
) {
  if (!Array.isArray(images)) {
    return;
  }

  const rows = images
    .map((image, index) => {
      if (typeof image === "string") {
        return { url: image.trim(), alt: fallbackAlt, sortOrder: index };
      }
      if (image && typeof image === "object") {
        const record = image as Record<string, unknown>;
        const url = asString(record.url);
        if (!url) {
          return null;
        }
        return {
          url,
          alt: asOptionalString(record.alt) ?? fallbackAlt,
          sortOrder: asInt(record.sortOrder) ?? index,
        };
      }
      return null;
    })
    .filter((row): row is { url: string; alt: string; sortOrder: number } => Boolean(row));

  await prisma.$transaction([
    prisma.machineImage.deleteMany({ where: { machineId } }),
    ...rows.map((row) =>
      prisma.machineImage.create({
        data: { ...row, machineId },
      }),
    ),
  ]);
}

export function machineCreateInput(body: Record<string, unknown>) {
  const name = asString(body.name);
  const categoryId = asString(body.categoryId);
  if (!name || !categoryId) {
    return { error: jsonError("name and categoryId are required") };
  }

  const price = body.price === undefined ? null : asDecimal(body.price);
  if (body.price !== undefined && body.price !== null && price === undefined) {
    return { error: jsonError("price must be a number") };
  }
  const previousPrice =
    body.previousPrice === undefined || body.previousPrice === null || body.previousPrice === ""
      ? null
      : asDecimal(body.previousPrice);
  if (
    body.previousPrice !== undefined &&
    body.previousPrice !== null &&
    body.previousPrice !== "" &&
    previousPrice === undefined
  ) {
    return { error: jsonError("previous price must be a number") };
  }
  if (body.status !== undefined && !asMachineStatus(body.status)) {
    return { error: jsonError("status must be AVAILABLE or SOLD") };
  }
  const stock = body.stock === undefined ? 1 : asInt(body.stock);
  if (stock === undefined || stock < 0) {
    return { error: jsonError("stock must be 0 or greater") };
  }

  return {
    data: {
      name,
      categoryId,
      slug: asString(body.slug) || slugify(name),
      year: asInt(body.year) ?? null,
      brand: asOptionalString(body.brand) ?? null,
      stock,
      controller: asOptionalString(body.controller) ?? null,
      condition: asOptionalString(body.condition) ?? null,
      location: asOptionalString(body.location) ?? null,
      price,
      previousPrice,
      sku: asOptionalString(body.sku) ?? null,
      subcategory: asOptionalString(body.subcategory) ?? null,
      childCategory: asOptionalString(body.childCategory) ?? null,
      status: asMachineStatus(body.status) ?? MachineStatus.AVAILABLE,
      type: asOptionalString(body.type) ?? null,
      description: asOptionalString(body.description) ?? null,
      featured: asBool(body.featured) ?? false,
      used: asBool(body.used) ?? true,
    },
  };
}

export function machineUpdateInput(body: Record<string, unknown>) {
  const data: Prisma.MachineUpdateInput = {};
  if (body.name !== undefined) {
    const name = asString(body.name);
    if (!name) {
      return { error: jsonError("name cannot be empty") };
    }
    data.name = name;
  }
  if (body.slug !== undefined) {
    const slug = asString(body.slug);
    if (!slug) {
      return { error: jsonError("slug cannot be empty") };
    }
    data.slug = slug;
  }
  if (body.categoryId !== undefined) {
    const categoryId = asString(body.categoryId);
    if (!categoryId) {
      return { error: jsonError("categoryId cannot be empty") };
    }
    data.category = { connect: { id: categoryId } };
  }
  if (body.year !== undefined) {
    data.year = body.year === null ? null : asInt(body.year);
  }
  if (body.brand !== undefined) {
    data.brand = asOptionalString(body.brand);
  }
  if (body.stock !== undefined) {
    const stock = asInt(body.stock);
    if (stock === undefined || stock < 0) {
      return { error: jsonError("stock must be 0 or greater") };
    }
    data.stock = stock;
  }
  if (body.controller !== undefined) {
    data.controller = asOptionalString(body.controller);
  }
  if (body.condition !== undefined) {
    data.condition = asOptionalString(body.condition);
  }
  if (body.location !== undefined) {
    data.location = asOptionalString(body.location);
  }
  if (body.price !== undefined) {
    const price = asDecimal(body.price);
    if (body.price !== null && price === undefined) {
      return { error: jsonError("price must be a number") };
    }
    data.price = price;
  }
  if (body.previousPrice !== undefined) {
    const previousPrice = asDecimal(body.previousPrice);
    if (body.previousPrice !== null && body.previousPrice !== "" && previousPrice === undefined) {
      return { error: jsonError("previous price must be a number") };
    }
    data.previousPrice = previousPrice ?? null;
  }
  if (body.sku !== undefined) {
    data.sku = asOptionalString(body.sku);
  }
  if (body.subcategory !== undefined) {
    data.subcategory = asOptionalString(body.subcategory);
  }
  if (body.childCategory !== undefined) {
    data.childCategory = asOptionalString(body.childCategory);
  }
  if (body.status !== undefined) {
    const status = asMachineStatus(body.status);
    if (!status) {
      return { error: jsonError("status must be AVAILABLE or SOLD") };
    }
    data.status = status;
  }
  if (body.type !== undefined) {
    data.type = asOptionalString(body.type);
  }
  if (body.description !== undefined) {
    data.description = asOptionalString(body.description);
  }
  if (body.featured !== undefined) {
    data.featured = asBool(body.featured);
  }
  if (body.used !== undefined) {
    data.used = asBool(body.used);
  }
  return { data };
}
