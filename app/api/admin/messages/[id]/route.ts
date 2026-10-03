import { jsonOk, prismaError } from "@/lib/admin-api";
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
  try {
    const message = await prisma.enquiryMessage.update({
      where: { id },
      data: { read: true },
    });
    return jsonOk({ message });
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
    await prisma.enquiryMessage.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
