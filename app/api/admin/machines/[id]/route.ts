import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import {
  machineInclude,
  machineUpdateInput,
  replaceImages,
} from "@/lib/machines-admin";
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
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: machineInclude,
    });
    if (!machine) {
      return jsonError("Machine not found", 404);
    }
    return jsonOk({ machine });
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

  const prepared = machineUpdateInput(parsed.data);
  if ("error" in prepared) {
    return prepared.error;
  }

  try {
    await prisma.machine.update({ where: { id }, data: prepared.data });
    if (parsed.data.images !== undefined) {
      const current = await prisma.machine.findUniqueOrThrow({
        where: { id },
        select: { name: true },
      });
      await replaceImages(id, parsed.data.images, current.name);
    }
    const machine = await prisma.machine.findUniqueOrThrow({
      where: { id },
      include: machineInclude,
    });
    return jsonOk({ machine });
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
  const forever = new URL(request.url).searchParams.get("forever") === "1";
  try {
    const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
    if (!machine) {
      return jsonError("Machine not found", 404);
    }
    if (forever) {
      if (!machine.deletedAt) {
        return jsonError("Move the product to the recycle bin before deleting it forever");
      }
      await prisma.machine.delete({ where: { id } });
      return jsonOk({ ok: true });
    }
    await prisma.machine.update({ where: { id }, data: { deletedAt: new Date() } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
