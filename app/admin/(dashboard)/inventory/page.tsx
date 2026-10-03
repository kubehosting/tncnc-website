import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InventoryTable } from "@/components/admin/inventory-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inventory Management" };
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const machines = await prisma.machine.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      brand: true,
      stock: true,
      status: true,
      category: { select: { name: true } },
    },
  });

  return (
    <>
      <AdminPageHeader
        title="Inventory Management"
        description="Machines and spare parts with stock levels and listing status."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/machines/export"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-gold"
            >
              Export to Excel
            </a>
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
      <InventoryTable rows={machines} />
    </>
  );
}
