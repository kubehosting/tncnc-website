import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDate, inr } from "@/lib/admin-ui";
import { getCustomerFromCookies } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCustomerFromCookies();
  if (!customer) {
    redirect("/account/login");
  }
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, customerId: customer.id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!invoice) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <Link href="/account" className="text-sm font-semibold text-navy hover:underline">
        ← My account
      </Link>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
            <h1 className="text-2xl font-extrabold text-navy">{invoice.invoiceNumber}</h1>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-navy">{invoice.status}</p>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Issued {formatDate(invoice.issuedAt)}
          {invoice.dueAt ? ` · Due ${formatDate(invoice.dueAt)}` : ""}
        </p>
        {invoice.notes ? <p className="mt-3 text-sm text-slate-600">{invoice.notes}</p> : null}

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-navy">{item.description}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">{inr(item.unitPrice)}</td>
                <td className="py-3 text-right font-semibold">{inr(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{inr(invoice.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">GST {Number(invoice.taxRate)}%</dt>
            <dd>{inr(invoice.taxAmount)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-navy">
            <dt>Total</dt>
            <dd>{inr(invoice.totalAmount)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
