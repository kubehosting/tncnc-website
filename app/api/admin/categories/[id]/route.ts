import { requireAdmin } from "@/lib/admin-auth";
import {
  asCategoryKind,
  asInt,
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
} from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { machines: { select: { id: true, name: true, slug: true, status: true } } },
    });
    if (!category) {
      return jsonError("Category not found", 404);
    }
    return jsonOk({ category });
  } catch (error) {
    return prismaError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const data: {
    name?: string;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    kind?: "MACHINE" | "SPARE";
    sortOrder?: number;
  } = {};
  if (parsed.data.name !== undefined) {
    const name = asString(parsed.data.name);
    if (!name) {
      return jsonError("name cannot be empty");
    }
    data.name = name;
  }
  if (parsed.data.slug !== undefined) {
    const slug = asString(parsed.data.slug);
    if (!slug) {
      return jsonError("slug cannot be empty");
    }
    data.slug = slug;
  }
  if (parsed.data.description !== undefined) {
    const description = asOptionalString(parsed.data.description);
    if (description !== undefined) {
      data.description = description;
    }
  }
  if (parsed.data.imageUrl !== undefined) {
    const imageUrl = asOptionalString(parsed.data.imageUrl);
    if (imageUrl !== undefined) {
      data.imageUrl = imageUrl;
    }
  }
  if (parsed.data.kind !== undefined) {
    const kind = asCategoryKind(parsed.data.kind);
    if (!kind) {
      return jsonError("kind must be MACHINE or SPARE");
    }
    data.kind = kind;
  }
  if (parsed.data.sortOrder !== undefined) {
    const sortOrder = asInt(parsed.data.sortOrder);
    if (sortOrder === undefined) {
      return jsonError("sortOrder must be a whole number");
    }
    data.sortOrder = sortOrder;
  }

  try {
    const category = await prisma.category.update({ where: { id }, data });
    return jsonOk({ category });
  } catch (error) {
    return prismaError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
