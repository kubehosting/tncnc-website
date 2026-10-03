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

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const invoiceId = new URL(request.url).searchParams.get("invoiceId") ?? undefined;
  try {
    const items = await prisma.invoiceItem.findMany({
      where: invoiceId ? { invoiceId } : undefined,
      include: {
        machine: { select: { id: true, name: true, slug: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { id: "asc" },
    });
    return jsonOk({ items });
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

  const invoiceId = asString(parsed.data.invoiceId);
  if (!invoiceId) {
    return jsonError("invoiceId is required");
  }

  const quantity = asInt(parsed.data.quantity) ?? 1;
  if (quantity < 1) {
    return jsonError("quantity must be at least 1");
  }

  let unitPrice = asDecimal(parsed.data.unitPrice);
  let description = asString(parsed.data.description);
  const machineId = asString(parsed.data.machineId) ?? null;

  if (machineId) {
    const machine = await prisma.machine.findUnique({ where: { id: machineId } });
    if (!machine) {
      return jsonError("Machine not found", 404);
    }
    description = description || machine.name;
    if (!unitPrice && machine.price) {
      unitPrice = machine.price;
    }
  }

  if (!description) {
    return jsonError("description or machineId is required");
  }
  if (!unitPrice) {
    return jsonError("unitPrice is required");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { stockDeducted: true, status: true },
  });
  if (!invoice) {
    return jsonError("Invoice not found", 404);
  }
  if (invoice.stockDeducted || invoice.status !== "DRAFT") {
    return jsonError("Finalized invoices cannot be edited. Create a new invoice instead.", 409);
  }

  try {
    const item = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        machineId,
        description,
        quantity,
        unitPrice,
        lineTotal: lineTotal(quantity, unitPrice),
      },
    });
    const updated = await syncInvoiceTotal(invoiceId);
    return jsonOk(
      {
        item,
        invoice: await prisma.invoice.findUnique({
          where: { id: updated.id },
          include: invoiceInclude,
        }),
      },
      201,
    );
  } catch (error) {
    return prismaError(error);
  }
}
