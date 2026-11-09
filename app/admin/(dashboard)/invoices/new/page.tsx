import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Create Invoice" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [customers, inventory] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.machine.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Create Invoice"
        description="Choose a customer, add inventory items, then save a draft or finalize to deduct stock."
      />
      <InvoiceForm
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
        }))}
        inventory={inventory.map((item) => ({
          id: item.id,
          name: item.name,
          stock: item.stock,
          price: item.price?.toString() ?? null,
          status: item.status,
          category: item.category,
        }))}
      />
    </>
  );
}
