import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InventoryForm } from "@/components/admin/inventory-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Create New Machine/Part" };
export const dynamic = "force-dynamic";

function uniqueNames(values: Array<string | null>) {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export default async function NewInventoryPage() {
  const [categories, hints] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.machine.findMany({
      select: { subcategory: true, childCategory: true },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Create New Machine/Part"
        description="Add specs, choose a category, set stock, and upload photos."
      />
      <InventoryForm
        categories={categories}
        subcategories={uniqueNames(hints.map((item) => item.subcategory))}
        childCategories={uniqueNames(hints.map((item) => item.childCategory))}
      />
    </>
  );
}
