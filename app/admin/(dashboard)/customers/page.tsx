import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Buyer details used on quotes and invoices."
      />
      <AdminTable columns={["Name", "Company", "Email", "Phone", "Account", "Invoices", ""]}>
        {customers.map((customer) => (
          <tr key={customer.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-navy">{customer.name}</td>
            <td className="px-4 py-3 text-slate-600">{customer.company ?? "—"}</td>
            <td className="px-4 py-3">{customer.email ?? "—"}</td>
            <td className="px-4 py-3">{customer.phone ?? "—"}</td>
            <td className="px-4 py-3">{customer.passwordHash ? "Website signup" : "Invoice only"}</td>
            <td className="px-4 py-3">{customer._count.invoices}</td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/admin/customers/${customer.id}`}
                className="rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white"
              >
                Details
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
