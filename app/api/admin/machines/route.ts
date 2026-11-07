import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import {
  asMachineStatus,
  machineCreateInput,
  machineInclude,
  replaceImages,
} from "@/lib/machines-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(request.url);
  const status = asMachineStatus(searchParams.get("status") ?? undefined);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const q = searchParams.get("q")?.trim();

  const where: Prisma.MachineWhereInput = {};
  if (status) {
    where.status = status;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { location: { contains: q } },
      { controller: { contains: q } },
    ];
  }

  try {
    const machines = await prisma.machine.findMany({
      where,
      include: machineInclude,
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ machines });
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

  const prepared = machineCreateInput(parsed.data);
  if ("error" in prepared) {
    return prepared.error;
  }

  try {
    const created = await prisma.machine.create({
      data: prepared.data,
      include: machineInclude,
    });
    if (parsed.data.images !== undefined) {
      await replaceImages(created.id, parsed.data.images, created.name);
    } else {
      const image = asString(parsed.data.image);
      if (image) {
        await replaceImages(created.id, [image], created.name);
      }
    }
    const machine = await prisma.machine.findUniqueOrThrow({
      where: { id: created.id },
      include: machineInclude,
    });
    return jsonOk({ machine }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
