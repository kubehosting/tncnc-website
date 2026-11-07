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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { issuedAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            issuedAt: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });
    if (!customer) {
      return jsonError("Customer not found", 404);
    }
    return jsonOk({ customer });
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

  const data: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) {
    const name = asString(parsed.data.name);
    if (!name) {
      return jsonError("name cannot be empty");
    }
    data.name = name;
  }
  if (parsed.data.email !== undefined) {
    const email = asOptionalString(parsed.data.email);
    if (email !== undefined) {
      data.email = email;
    }
  }
  if (parsed.data.phone !== undefined) {
    const phone = asOptionalString(parsed.data.phone);
    if (phone !== undefined) {
      data.phone = phone;
    }
  }
  if (parsed.data.company !== undefined) {
    const company = asOptionalString(parsed.data.company);
    if (company !== undefined) {
      data.company = company;
    }
  }
  if (parsed.data.address !== undefined) {
    const address = asOptionalString(parsed.data.address);
    if (address !== undefined) {
      data.address = address;
    }
  }
  if (parsed.data.notes !== undefined) {
    const notes = asOptionalString(parsed.data.notes);
    if (notes !== undefined) {
      data.notes = notes;
    }
  }

  try {
    const customer = await prisma.customer.update({ where: { id }, data });
    return jsonOk({ customer });
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
    await prisma.customer.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
