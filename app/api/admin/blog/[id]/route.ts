import { asOptionalString, asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const data: { title?: string; body?: string | null; published?: boolean } = {};
  if (parsed.data.title !== undefined) {
    const title = asString(parsed.data.title);
    if (!title) {
      return jsonError("title cannot be empty");
    }
    data.title = title;
  }
  if (parsed.data.body !== undefined) {
    data.body = asOptionalString(parsed.data.body) ?? "";
  }
  if (typeof parsed.data.published === "boolean") {
    data.published = parsed.data.published;
  }
  try {
    const post = await prisma.blogPost.update({ where: { id }, data });
    return jsonOk({ post });
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
    await prisma.blogPost.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
