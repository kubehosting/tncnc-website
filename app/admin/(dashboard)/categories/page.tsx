import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryManager } from "@/components/admin/category-manager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Manage Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { machines: { where: { deletedAt: null } } } } },
  });

  return (
    <>
      <AdminPageHeader
        title="Manage Categories"
        description="Add photos for machine types and spare-part groups. These appear on the public homepage."
      />
      <CategoryManager initial={categories} />
    </>
  );
}
