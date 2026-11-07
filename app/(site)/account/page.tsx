import type { Metadata } from "next";
import { CustomerLogoutButton } from "@/components/customer-logout-button";
import { formatDate, inr } from "@/lib/admin-ui";
import { getCustomerFromCookies } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const customer = await getCustomerFromCookies();
  if (!customer) {
    redirect("/account/login");
  }

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Hello, {customer.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{customer.email}</p>
          {customer.phone ? <p className="text-sm text-slate-600">{customer.phone}</p> : null}
        </div>
        <CustomerLogoutButton />
      </div>

      <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-bold text-navy">Your invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No invoices yet. Request a quote and we will link it here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium text-navy">{invoice.invoiceNumber}</span>
                <span>{formatDate(invoice.issuedAt)}</span>
                <span>{inr(invoice.totalAmount)}</span>
                <span className="text-slate-500">{invoice.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
