import { requireAdmin } from "@/lib/admin-auth";
import {
  asDecimal,
  asInt,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
} from "@/lib/admin-api";
import { invoiceInclude, lineTotal, syncInvoiceTotal } from "@/lib/invoices";
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
    const item = await prisma.invoiceItem.findUnique({
      where: { id },
      include: {
        machine: { select: { id: true, name: true, slug: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    });
    if (!item) {
      return jsonError("Invoice item not found", 404);
    }
    return jsonOk({ item });
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

  try {
    const existing = await prisma.invoiceItem.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Invoice item not found", 404);
    }

    const quantity = parsed.data.quantity === undefined ? existing.quantity : asInt(parsed.data.quantity);
    if (!quantity || quantity < 1) {
      return jsonError("quantity must be at least 1");
    }

    const unitPrice =
      parsed.data.unitPrice === undefined
        ? existing.unitPrice
        : asDecimal(parsed.data.unitPrice);
    if (!unitPrice) {
      return jsonError("unitPrice must be a number");
    }

    let machineId = existing.machineId;
    if (parsed.data.machineId !== undefined) {
      machineId = asString(parsed.data.machineId) ?? null;
      if (machineId) {
        const machine = await prisma.machine.findUnique({ where: { id: machineId } });
        if (!machine) {
          return jsonError("Machine not found", 404);
        }
      }
    }

    const description =
      parsed.data.description === undefined
        ? existing.description
        : asString(parsed.data.description);
    if (!description) {
      return jsonError("description cannot be empty");
    }

    const item = await prisma.invoiceItem.update({
      where: { id },
      data: {
        quantity,
        unitPrice,
        lineTotal: lineTotal(quantity, unitPrice),
        description,
        machineId,
      },
    });
    await syncInvoiceTotal(existing.invoiceId);
    const invoice = await prisma.invoice.findUnique({
      where: { id: existing.invoiceId },
      include: invoiceInclude,
    });
    return jsonOk({ item, invoice });
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
    const existing = await prisma.invoiceItem.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Invoice item not found", 404);
    }
    await prisma.invoiceItem.delete({ where: { id } });
    await syncInvoiceTotal(existing.invoiceId);
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
