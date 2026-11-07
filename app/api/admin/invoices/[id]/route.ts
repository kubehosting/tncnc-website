import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  asDate,
  asDecimal,
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
} from "@/lib/admin-api";
import { asInvoiceStatus, finalizeInvoice, invoiceInclude, restoreStock, syncInvoiceTotal } from "@/lib/invoices";
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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!invoice) {
      return jsonError("Invoice not found", 404);
    }
    return jsonOk({ invoice });
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

  const current = await prisma.invoice.findUnique({ where: { id } });
  if (!current) {
    return jsonError("Invoice not found", 404);
  }

  const nextStatus = asInvoiceStatus(parsed.data.status);
  if (
    parsed.data.status !== undefined &&
    nextStatus &&
    current.status === "DRAFT" &&
    nextStatus !== "DRAFT"
  ) {
    try {
      const invoice = await finalizeInvoice(id, nextStatus);
      return jsonOk({ invoice });
    } catch (error) {
      if (error instanceof Error && /stock|inventory/i.test(error.message)) {
        return jsonError(error.message, 409);
      }
      return prismaError(error);
    }
  }

  const data: Prisma.InvoiceUpdateInput = {};
  if (parsed.data.customerId !== undefined) {
    const customerId = asString(parsed.data.customerId);
    if (!customerId) {
      return jsonError("customerId cannot be empty");
    }
    data.customer = { connect: { id: customerId } };
  }
  if (parsed.data.invoiceNumber !== undefined) {
    const invoiceNumber = asString(parsed.data.invoiceNumber);
    if (!invoiceNumber) {
      return jsonError("invoiceNumber cannot be empty");
    }
    data.invoiceNumber = invoiceNumber;
  }
  if (parsed.data.status !== undefined) {
    const status = asInvoiceStatus(parsed.data.status);
    if (!status) {
      return jsonError("status must be DRAFT, PAID, PENDING, or OVERDUE");
    }
    data.status = status;
  }
  if (parsed.data.notes !== undefined) {
    data.notes = asOptionalString(parsed.data.notes);
  }
  if (parsed.data.issuedAt !== undefined) {
    const issuedAt = asDate(parsed.data.issuedAt);
    if (!issuedAt) {
      return jsonError("issuedAt must be an ISO date");
    }
    data.issuedAt = issuedAt;
  }
  if (parsed.data.dueAt !== undefined) {
    const dueAt = asDate(parsed.data.dueAt);
    if (parsed.data.dueAt !== null && dueAt === undefined) {
      return jsonError("dueAt must be an ISO date");
    }
    data.dueAt = dueAt;
  }
  if (parsed.data.taxRate !== undefined) {
    const taxRate = asDecimal(parsed.data.taxRate);
    if (!taxRate || taxRate.lessThan(0)) {
      return jsonError("taxRate must be 0 or greater");
    }
    data.taxRate = taxRate;
  }

  try {
    await prisma.invoice.update({ where: { id }, data });
    if (parsed.data.taxRate !== undefined) {
      await syncInvoiceTotal(id);
    }
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: invoiceInclude,
    });
    return jsonOk({ invoice });
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
    await restoreStock(id);
    await prisma.invoice.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
