import {
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
  slugify,
} from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ posts });
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
  const title = asString(parsed.data.title);
  if (!title) {
    return jsonError("title is required");
  }
  try {
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: asString(parsed.data.slug) || slugify(title),
        body: asOptionalString(parsed.data.body) ?? "",
        published: parsed.data.published !== false,
      },
    });
    return jsonOk({ post }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
