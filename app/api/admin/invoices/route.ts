import { InvoiceStatus, Prisma } from "@prisma/client";
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
import {
  asInvoiceStatus,
  finalizeInvoice,
  invoiceInclude,
  invoiceTotals,
  nextInvoiceNumber,
  resolveInvoiceItems,
} from "@/lib/invoices";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(request.url);
  const status = asInvoiceStatus(searchParams.get("status") ?? undefined);
  const customerId = searchParams.get("customerId") ?? undefined;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: invoiceInclude,
      orderBy: { issuedAt: "desc" },
    });
    return jsonOk({ invoices });
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

  let customerId = asString(parsed.data.customerId);
  const newCustomer = parsed.data.customer;
  if (!customerId && newCustomer && typeof newCustomer === "object") {
    const customer = newCustomer as Record<string, unknown>;
    const name = asString(customer.name);
    if (!name) {
      return jsonError("New customer needs a name");
    }
    const created = await prisma.customer.create({
      data: {
        name,
        email: asOptionalString(customer.email),
        phone: asOptionalString(customer.phone),
        company: asOptionalString(customer.company),
        address: asOptionalString(customer.address),
      },
    });
    customerId = created.id;
  }
  if (!customerId) {
    return jsonError("Select a customer or add a new one");
  }

  if (parsed.data.status !== undefined && !asInvoiceStatus(parsed.data.status)) {
    return jsonError("status must be DRAFT, PAID, PENDING, or OVERDUE");
  }

  const issuedAt = parsed.data.issuedAt === undefined ? new Date() : asDate(parsed.data.issuedAt);
  if (issuedAt === undefined) {
    return jsonError("issuedAt must be an ISO date");
  }
  const dueAt = parsed.data.dueAt === undefined ? null : asDate(parsed.data.dueAt);
  if (parsed.data.dueAt !== undefined && dueAt === undefined) {
    return jsonError("dueAt must be an ISO date");
  }

  const taxRate = parsed.data.taxRate === undefined ? new Prisma.Decimal(18) : asDecimal(parsed.data.taxRate);
  if (!taxRate || taxRate.lessThan(0)) {
    return jsonError("taxRate must be 0 or greater");
  }

  const resolved = await resolveInvoiceItems(parsed.data.items);
  if ("error" in resolved) {
    return resolved.error;
  }

  const totals = invoiceTotals(
    resolved.items.map((item) => item.lineTotal),
    taxRate,
  );
  const requestedStatus = asInvoiceStatus(parsed.data.status);
  const wantsFinalize =
    Boolean(parsed.data.finalize) ||
    requestedStatus === InvoiceStatus.PENDING ||
    requestedStatus === InvoiceStatus.PAID ||
    requestedStatus === InvoiceStatus.OVERDUE;

  try {
    let invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: asString(parsed.data.invoiceNumber) || (await nextInvoiceNumber()),
        customerId,
        issuedAt: issuedAt ?? new Date(),
        dueAt,
        status: InvoiceStatus.DRAFT,
        notes: asOptionalString(parsed.data.notes),
        taxRate,
        ...totals,
        items: { create: resolved.items },
      },
      include: invoiceInclude,
    });

    if (wantsFinalize) {
      try {
        invoice = await finalizeInvoice(
          invoice.id,
          requestedStatus && requestedStatus !== InvoiceStatus.DRAFT
            ? requestedStatus
            : InvoiceStatus.PENDING,
        );
      } catch (error) {
        await prisma.invoice.delete({ where: { id: invoice.id } });
        throw error;
      }
    }

    return jsonOk({ invoice }, 201);
  } catch (error) {
    if (error instanceof Error && /stock|inventory/i.test(error.message)) {
      return jsonError(error.message, 409);
    }
    return prismaError(error);
  }
}
