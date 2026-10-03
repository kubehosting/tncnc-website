import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, StatusPill } from "@/components/admin/admin-ui";
import { formatDate, inr } from "@/lib/admin-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

const tone = {
  DRAFT: "slate",
  PENDING: "amber",
  PAID: "green",
  OVERDUE: "red",
} as const;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { invoices: { orderBy: { issuedAt: "desc" } } },
  });
  if (!customer) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title={customer.name}
        description={customer.company ?? "Customer record"}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 text-sm shadow-sm">
          <p>Email: {customer.email ?? "—"}</p>
          <p className="mt-2">Phone: {customer.phone ?? "—"}</p>
          <p className="mt-2">Address: {customer.address ?? "—"}</p>
          <p className="mt-2">
            Website account: {customer.passwordHash ? "Yes (signed up)" : "No"}
          </p>
          <p className="mt-2">Joined: {formatDate(customer.createdAt)}</p>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-navy">Orders</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {customer.invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/invoices/${invoice.id}`} className="font-medium text-navy">
                  {invoice.invoiceNumber}
                </Link>
                <span>{inr(invoice.totalAmount)}</span>
                <StatusPill value={invoice.status} tone={tone[invoice.status]} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
