import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InventoryBoard } from "@/components/admin/inventory-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inventory Management" };
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [machines, categories, recycled] = await Promise.all([
    prisma.machine.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        brand: true,
        stock: true,
        status: true,
        category: { select: { id: true, name: true } },
        sku: true,
        subcategory: true,
        childCategory: true,
        price: true,
        previousPrice: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.machine.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Inventory Management"
        description="All products in boxes, grouped by category, with the total on each box."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/inventory/recycle"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-gold"
            >
              Recycle bin ({recycled})
            </Link>
            <Link
              href="/admin/inventory/bulk"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-gold"
            >
              Bulk Import
            </Link>
            <Link
              href="/admin/inventory/new"
              className="inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-hover"
            >
              Create New Machine/Part
            </Link>
          </div>
        }
      />
      <InventoryBoard
        rows={machines.map((machine) => ({
          ...machine,
          price: machine.price?.toString() ?? null,
          previousPrice: machine.previousPrice?.toString() ?? null,
        }))}
        categories={categories}
      />
    </>
  );
}
