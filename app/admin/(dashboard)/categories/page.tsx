import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryManager } from "@/components/admin/category-manager";
import { getCategoryTrees } from "@/lib/category-taxonomy";
import { ensureDatabase } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Manage Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await ensureDatabase().catch((error) => {
    console.error("Could not prepare the database for categories.", error);
  });
  const [categories, trees] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { machines: { where: { deletedAt: null } } } } },
    }),
    getCategoryTrees(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Manage Categories"
        description="Add photos, subcategories, and child categories, and choose which categories appear on the homepage."
      />
      <CategoryManager
        initial={categories.map((category) => ({
          ...category,
          subcategories: trees.get(category.id) ?? [],
        }))}
      />
    </>
  );
}
