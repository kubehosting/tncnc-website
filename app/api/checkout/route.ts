import { Prisma } from "@prisma/client";
import { asDecimal, asOptionalString, asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { invoiceTotals, lineTotal } from "@/lib/invoices";
import { isValidEmail, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

async function nextNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const last = Number(latest?.invoiceNumber.split("-").at(-1) ?? 0);
  return `${prefix}${String(last + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const rawItems = Array.isArray(parsed.data.items) ? parsed.data.items : [];
  const requested = new Map<string, { quantity: number; unitPrice: Prisma.Decimal | null | undefined }>();
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") {
      return jsonError("Each cart item must include a product");
    }
    const row = entry as Record<string, unknown>;
    const slug = asString(row.slug);
    const quantity = Number(row.quantity);
    if (!slug || !Number.isInteger(quantity) || quantity < 1) {
      return jsonError("Each cart item needs a product and a quantity of at least 1");
    }
    const current = requested.get(slug) ?? { quantity: 0, unitPrice: asDecimal(row.unitPrice) };
    requested.set(slug, {
      quantity: current.quantity + quantity,
      unitPrice: current.unitPrice ?? asDecimal(row.unitPrice),
    });
  }
  if (requested.size === 0) {
    return jsonError("Your cart is empty");
  }

  const buyer = parsed.data.customer;
  const buyerRecord = buyer && typeof buyer === "object" ? (buyer as Record<string, unknown>) : {};
  const signedIn = await getCustomerFromRequest(request);

  try {
    const settings = await getSiteSettings();
    const taxValue = Number(settings.gstRate);
    const taxRate = new Prisma.Decimal(Number.isFinite(taxValue) ? taxValue : 18);
    const machines = await prisma.machine.findMany({ where: { slug: { in: [...requested.keys()] } } });
    const bySlug = new Map(machines.map((machine) => [machine.slug, machine]));
    const items: {
      description: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
      machineId: string;
    }[] = [];

    for (const [slug, request] of requested) {
      const machine = bySlug.get(slug);
      if (!machine || machine.status !== "AVAILABLE") {
        return jsonError(`${machine?.name ?? slug} is no longer available`);
      }
      if (request.quantity > machine.stock) {
        return jsonError(`Only ${machine.stock} available for ${machine.name}`);
      }
      const unitPrice = machine.price ?? request.unitPrice;
      if (!unitPrice || unitPrice.lessThanOrEqualTo(0)) {
        return jsonError(`Enter a price for ${machine.name}`);
      }
      items.push({
        description: machine.name,
        quantity: request.quantity,
        unitPrice,
        lineTotal: lineTotal(request.quantity, unitPrice),
        machineId: machine.id,
      });
    }

    const totals = invoiceTotals(
      items.map((item) => item.lineTotal),
      taxRate,
    );
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const sessionCustomer = signedIn;
    const invoice = await prisma.$transaction(async (tx) => {
      let customerId = sessionCustomer?.id;
      if (!customerId) {
        const name = asString(buyerRecord.name);
        const emailRaw = asString(buyerRecord.email);
        const phone = asString(buyerRecord.phone);
        if (!name || !emailRaw || !isValidEmail(emailRaw) || !phone) {
          return { error: "Name, email, and phone are required" as const };
        }
        const email = normalizeEmail(emailRaw);
        const existing = await tx.customer.findFirst({ where: { email } });
        if (existing?.passwordHash) {
          return { error: "Sign in to place this order with your account" as const, status: 409 as const };
        }
        const saved = existing
          ? await tx.customer.update({
              where: { id: existing.id },
              data: {
                name,
                phone,
                company: asOptionalString(buyerRecord.company) ?? existing.company,
                address: asOptionalString(buyerRecord.address) ?? existing.address,
              },
            })
          : await tx.customer.create({
              data: {
                name,
                email,
                phone,
                company: asOptionalString(buyerRecord.company),
                address: asOptionalString(buyerRecord.address),
              },
            });
        customerId = saved.id;
      } else {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            phone: asOptionalString(buyerRecord.phone) ?? sessionCustomer?.phone,
            company: asOptionalString(buyerRecord.company) ?? sessionCustomer?.company,
            address: asOptionalString(buyerRecord.address) ?? sessionCustomer?.address,
          },
        });
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: await nextNumber(tx),
          dueAt,
          taxRate,
          ...totals,
          status: "DRAFT",
          notes: "Placed from the website cart. Finalize this invoice to reserve stock.",
          customerId,
          items: { create: items },
        },
      });
    });

    if ("error" in invoice) {
      return jsonError(invoice.error, "status" in invoice ? invoice.status : 400);
    }

    return jsonOk({
      ok: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
      },
    });
  } catch (error) {
    return prismaError(error);
  }
}
