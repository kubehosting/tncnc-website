import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InventoryForm } from "@/components/admin/inventory-form";
import { getCategoryOptions } from "@/lib/category-taxonomy";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Create New Machine/Part" };
export const dynamic = "force-dynamic";


export default async function NewInventoryPage() {
  const [categories, options] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    getCategoryOptions(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Create New Machine/Part"
        description="Add specs, choose a category, set stock, and upload photos."
      />
      <InventoryForm
        categories={categories}
        options={options}
      />
    </>
  );
}
