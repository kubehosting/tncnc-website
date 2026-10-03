import { jsonOk, prismaError } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    await prisma.coupon.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
