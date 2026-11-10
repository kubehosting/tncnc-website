import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SubcategoryManager } from "@/components/admin/taxonomy-manager";
import { getTaxonomyPageData } from "@/lib/category-taxonomy";
import { ensureDatabase } from "@/lib/ensure-db";

export const metadata: Metadata = { title: "Sub Category" };
export const dynamic = "force-dynamic";

export default async function SubCategoryPage({ searchParams }: PageProps<"/admin/categories/sub">) {
  await ensureDatabase().catch((error) => {
    console.error("Could not prepare the database for sub categories.", error);
  });
  const [{ category }, { categories, trees }] = await Promise.all([searchParams, getTaxonomyPageData()]);
  const initialCategory =
    typeof category === "string" && categories.some((entry) => entry.id === category) ? category : "";

  return (
    <>
      <AdminPageHeader
        title="Sub Category"
        description="Sub categories sit under a main category and power the website filters and menu."
      />
      <SubcategoryManager categories={categories} trees={trees} initialCategory={initialCategory} />
    </>
  );
}
