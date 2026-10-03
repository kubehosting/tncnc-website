import { asInt, asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  try {
    const regions = await prisma.serviceRegion.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return jsonOk({ regions });
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
  try {
    const region = await prisma.serviceRegion.create({
      data: {
        name,
        country: asString(parsed.data.country) || "India",
        sortOrder: asInt(parsed.data.sortOrder) ?? 0,
      },
    });
    return jsonOk({ region }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
