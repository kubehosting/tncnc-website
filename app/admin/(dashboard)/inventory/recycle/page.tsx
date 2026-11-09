import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { RecycleBin } from "@/components/admin/recycle-bin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Recycle bin" };
export const dynamic = "force-dynamic";

export default async function RecycleBinPage() {
  const machines = await prisma.machine.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      sku: true,
      subcategory: true,
      childCategory: true,
      deletedAt: true,
      category: { select: { name: true } },
    },
  });

  return (
    <>
      <AdminPageHeader
        title="Recycle bin"
        description="Deleted products stay here until you restore them or delete them forever."
        action={
          <Link
            href="/admin/inventory"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-gold"
          >
            Back to inventory
          </Link>
        }
      />
      <RecycleBin
        rows={machines.map((machine) => ({
          ...machine,
          deletedAt: machine.deletedAt?.toISOString() ?? "",
        }))}
      />
    </>
  );
}
