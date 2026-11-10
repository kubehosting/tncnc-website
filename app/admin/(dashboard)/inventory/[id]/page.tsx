import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { InventoryForm } from "@/components/admin/inventory-form";
import { getCategoryOptions } from "@/lib/category-taxonomy";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit inventory item" };
export const dynamic = "force-dynamic";


export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, machine, options] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.machine.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    getCategoryOptions(),
  ]);

  if (!machine) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title={`Edit ${machine.name}`}
        description={
          machine.deletedAt
            ? "This product is in the recycle bin. Restore it before it appears on the website."
            : "Update technical specs, category, stock, and photos."
        }
      />
      <InventoryForm
        categories={categories}
        options={options}
        machine={{
          id: machine.id,
          name: machine.name,
          brand: machine.brand,
          year: machine.year,
          controller: machine.controller,
          condition: machine.condition,
          location: machine.location,
          price: machine.price?.toString() ?? null,
          stock: machine.stock,
          status: machine.status,
          type: machine.type,
          description: machine.description,
          categoryId: machine.categoryId,
          used: machine.used,
          sku: machine.sku,
          subcategory: machine.subcategory,
          childCategory: machine.childCategory,
          previousPrice: machine.previousPrice?.toString() ?? null,
          images: machine.images.map((image) => ({ url: image.url })),
        }}
      />
    </>
  );
}
