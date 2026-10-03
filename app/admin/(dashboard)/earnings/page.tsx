import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { inr } from "@/lib/admin-ui";
import { amount } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Total Earning" };
export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const paid = await prisma.invoice.findMany({
    where: { status: "PAID" },
    orderBy: { issuedAt: "desc" },
    include: { customer: true },
  });
  const total = paid.reduce((sum, invoice) => sum + amount(invoice.totalAmount), 0);

  return (
    <>
      <AdminPageHeader
        title="Total Earning"
        description="Paid invoices only. Drafts and pending bills are excluded."
      />
      <p className="mb-4 text-3xl font-bold text-navy">{inr(total)}</p>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paid.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium text-navy">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3">{invoice.customer.name}</td>
                <td className="px-4 py-3">{inr(invoice.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
