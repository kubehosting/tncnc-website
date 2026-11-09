import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, prismaError } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  try {
    const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true } });
    if (!machine) {
      return jsonError("Machine not found", 404);
    }
    await prisma.machine.update({ where: { id }, data: { deletedAt: null } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
