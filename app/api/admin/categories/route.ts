import { requireAdmin } from "@/lib/admin-auth";
import {
  asBool,
  asCategoryKind,
  asInt,
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
  slugify,
} from "@/lib/admin-api";
import { cleanSubmittedTree, saveCategoryTree } from "@/lib/category-taxonomy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { machines: true } } },
    });
    return jsonOk({ categories });
  } catch (error) {
    return prismaError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const name = asString(parsed.data.name);
  if (!name) {
    return jsonError("name is required");
  }

  const kind = asCategoryKind(parsed.data.kind) ?? "MACHINE";
  const sortOrder = asInt(parsed.data.sortOrder) ?? 0;
  const image = asOptionalString(parsed.data.imageUrl);

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug: asString(parsed.data.slug) || slugify(name),
        description: asOptionalString(parsed.data.description),
        imageUrl: image === undefined ? null : image,
        kind,
        sortOrder,
        showOnHome: asBool(parsed.data.showOnHome) ?? true,
      },
    });
    const tree = cleanSubmittedTree(parsed.data.subcategories);
    if (tree?.length) {
      await saveCategoryTree(category.id, tree);
    }
    return jsonOk({ category }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
