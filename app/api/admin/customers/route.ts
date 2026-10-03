import { requireAdmin } from "@/lib/admin-auth";
import {
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
} from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  try {
    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { company: { contains: q } },
            ],
          }
        : undefined,
      include: { _count: { select: { invoices: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ customers });
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
    const customer = await prisma.customer.create({
      data: {
        name,
        email: asOptionalString(parsed.data.email),
        phone: asOptionalString(parsed.data.phone),
        company: asOptionalString(parsed.data.company),
        address: asOptionalString(parsed.data.address),
        notes: asOptionalString(parsed.data.notes),
      },
    });
    return jsonOk({ customer }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
