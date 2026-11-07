import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InvoiceTable } from "@/components/admin/invoice-table";
import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const filters: Record<string, InvoiceStatus[]> = {
  pending: ["PENDING", "OVERDUE"],
  processing: ["DRAFT"],
  completed: ["PAID"],
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = typeof status === "string" ? filters[status] : undefined;
  const invoices = await prisma.invoice.findMany({
    where: filter ? { status: { in: filter } } : undefined,
    orderBy: { issuedAt: "desc" },
    include: { customer: true, items: true },
  });

  const title =
    status === "pending"
      ? "Orders Pending"
      : status === "processing"
        ? "Orders Processing"
        : status === "completed"
          ? "Orders Completed"
          : "Orders";

  return (
    <>
      <AdminPageHeader
        title={title}
        description="Invoices are treated as orders: pending, processing (draft), and completed (paid)."
        action={
          <Link
            href="/admin/invoices/new"
            className="inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-hover"
          >
            Create Invoice
          </Link>
        }
      />
      <InvoiceTable
        rows={invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          issuedAt: invoice.issuedAt.toISOString(),
          totalAmount: invoice.totalAmount.toString(),
          status: invoice.status,
          customer: { name: invoice.customer.name },
          items: invoice.items.map(() => true),
        }))}
      />
    </>
  );
}
