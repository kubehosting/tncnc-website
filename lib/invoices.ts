import { InvoiceStatus, Prisma } from "@prisma/client";
import { asDecimal, asInt, asString, jsonError } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const invoiceInclude = {
  customer: true,
  items: {
    include: {
      machine: {
        select: { id: true, name: true, slug: true, stock: true, status: true, price: true },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const last = latest?.invoiceNumber.split("-").at(-1);
  const seq = last ? Number(last) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function lineTotal(quantity: number, unitPrice: Prisma.Decimal) {
  return new Prisma.Decimal(quantity).mul(unitPrice);
}

export function invoiceTotals(itemTotals: Prisma.Decimal[], taxRate: Prisma.Decimal) {
  const subtotal = itemTotals.reduce((sum, value) => sum.add(value), new Prisma.Decimal(0));
  const taxAmount = subtotal.mul(taxRate).div(100);
  return {
    subtotal,
    taxAmount,
    totalAmount: subtotal.add(taxAmount),
  };
}

export function asInvoiceStatus(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  return (Object.values(InvoiceStatus) as string[]).includes(normalized)
    ? (normalized as InvoiceStatus)
    : undefined;
}

export async function resolveInvoiceItems(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: jsonError("Add at least one inventory item") };
  }

  const items: {
    description: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
    machineId: string | null;
  }[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      return { error: jsonError("Each invoice item must be an object") };
    }
    const row = entry as Record<string, unknown>;
    const quantity = asInt(row.quantity) ?? 1;
    if (quantity < 1) {
      return { error: jsonError("quantity must be at least 1") };
    }

    let description = asString(row.description);
    const machineId = asString(row.machineId) ?? null;
    let unitPrice = asDecimal(row.unitPrice);

    if (machineId) {
      const machine = await prisma.machine.findUnique({ where: { id: machineId } });
      if (!machine) {
        return { error: jsonError(`Inventory item not found: ${machineId}`, 404) };
      }
      description = description || machine.name;
      if (!unitPrice && machine.price) {
        unitPrice = machine.price;
      }
    }

    if (!description) {
      return { error: jsonError("Each line needs a description or inventory item") };
    }
    if (!unitPrice) {
      return { error: jsonError("Each line needs a unit price") };
    }

    items.push({
      description,
      quantity,
      unitPrice,
      lineTotal: lineTotal(quantity, unitPrice),
      machineId,
    });
  }

  return { items };
}

export async function syncInvoiceTotal(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { items: true },
  });
  const totals = invoiceTotals(
    invoice.items.map((item) => item.lineTotal),
    invoice.taxRate,
  );
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: totals,
  });
}

export async function applyStockDeduction(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (invoice.stockDeducted) {
    return invoice;
  }

  const needed = new Map<string, number>();
  for (const item of invoice.items) {
    if (!item.machineId) {
      continue;
    }
    needed.set(item.machineId, (needed.get(item.machineId) ?? 0) + item.quantity);
  }

  const machines = await prisma.machine.findMany({
    where: { id: { in: [...needed.keys()] } },
  });
  const byId = new Map(machines.map((machine) => [machine.id, machine]));

  for (const [machineId, quantity] of needed) {
    const machine = byId.get(machineId);
    if (!machine) {
      throw new Error("An inventory item on this invoice no longer exists");
    }
    if (machine.stock < quantity) {
      throw new Error(
        `Not enough stock for ${machine.name}. Available: ${machine.stock}, needed: ${quantity}.`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [machineId, quantity] of needed) {
      const machine = byId.get(machineId)!;
      const stock = machine.stock - quantity;
      await tx.machine.update({
        where: { id: machineId },
        data: {
          stock,
          status: stock <= 0 ? "SOLD" : machine.status,
        },
      });
    }
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { stockDeducted: true },
    });
  });

  return prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: invoiceInclude,
  });
}

export async function restoreStock(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice?.stockDeducted) {
    return;
  }

  const restore = new Map<string, number>();
  for (const item of invoice.items) {
    if (!item.machineId) {
      continue;
    }
    restore.set(item.machineId, (restore.get(item.machineId) ?? 0) + item.quantity);
  }

  await prisma.$transaction(async (tx) => {
    for (const [machineId, quantity] of restore) {
      const machine = await tx.machine.findUnique({ where: { id: machineId } });
      if (!machine) {
        continue;
      }
      const stock = machine.stock + quantity;
      await tx.machine.update({
        where: { id: machineId },
        data: {
          stock,
          status: stock > 0 ? "AVAILABLE" : machine.status,
        },
      });
    }
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { stockDeducted: false },
    });
  });
}

export async function finalizeInvoice(invoiceId: string, nextStatus: InvoiceStatus = InvoiceStatus.PENDING) {
  if (nextStatus === InvoiceStatus.DRAFT) {
    throw new Error("Finalized invoices cannot stay in Draft");
  }
  await applyStockDeduction(invoiceId);
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: nextStatus },
    include: invoiceInclude,
  });
}
