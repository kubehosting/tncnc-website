import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ChildCategoryManager } from "@/components/admin/taxonomy-manager";
import { getTaxonomyPageData } from "@/lib/category-taxonomy";
import { ensureDatabase } from "@/lib/ensure-db";

export const metadata: Metadata = { title: "Child Category" };
export const dynamic = "force-dynamic";

export default async function ChildCategoryPage({ searchParams }: PageProps<"/admin/categories/child">) {
  await ensureDatabase().catch((error) => {
    console.error("Could not prepare the database for child categories.", error);
  });
  const [{ category, sub }, { categories, trees }] = await Promise.all([searchParams, getTaxonomyPageData()]);
  const initialCategory =
    typeof category === "string" && categories.some((entry) => entry.id === category) ? category : "";
  const initialSub =
    initialCategory && typeof sub === "string"
      ? ((trees[initialCategory] ?? []).find((node) => node.name.toLowerCase() === sub.toLowerCase())?.name ?? "")
      : "";

  return (
    <>
      <AdminPageHeader
        title="Child Category"
        description="Child categories sit under a sub category for the finest level of filtering."
      />
      <ChildCategoryManager
        categories={categories}
        trees={trees}
        initialCategory={initialCategory}
        initialSub={initialSub}
      />
    </>
  );
}
