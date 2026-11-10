import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryManager } from "@/components/admin/category-manager";
import { getCategoryTrees } from "@/lib/category-taxonomy";
import { ensureDatabase } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Main Category" };
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
        title="Main Category"
        description="Add photos and choose which categories appear on the homepage. Sub and child categories have their own pages."
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
