import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader, StatusPill } from "@/components/admin/admin-ui";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { formatDate, inr } from "@/lib/admin-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

const tones = {
  DRAFT: "slate",
  PENDING: "amber",
  PAID: "green",
  OVERDUE: "red",
} as const;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { machine: true } },
    },
  });
  if (!invoice) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.customer.name} · ${formatDate(invoice.issuedAt)}`}
        action={<StatusPill value={invoice.status} tone={tones[invoice.status]} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{inr(item.unitPrice)}</td>
                  <td className="px-4 py-3 font-medium">{inr(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t border-slate-100 px-4 py-4 text-sm">
            <p className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{inr(invoice.subtotal)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">GST ({invoice.taxRate.toString()}%)</span>
              <span>{inr(invoice.taxAmount)}</span>
            </p>
            <p className="flex justify-between text-base font-bold text-navy">
              <span>Total</span>
              <span>{inr(invoice.totalAmount)}</span>
            </p>
          </div>
        </div>
        <InvoiceActions
          id={invoice.id}
          number={invoice.invoiceNumber}
          status={invoice.status}
          customerEmail={invoice.customer.email}
        />
      </div>
    </>
  );
}
