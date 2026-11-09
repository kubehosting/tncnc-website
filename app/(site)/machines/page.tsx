import type { Metadata } from "next";
import { CatalogFilters } from "@/components/catalog-filters";
import { MachineCard } from "@/components/machine-card";
import { PageHero } from "@/components/page-hero";
import { machines as catalogMachines } from "@/lib/catalog";
import { listFilteredMachines } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "All Machines",
};
export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: PageProps<"/machines">) {
  const { type, sub, child, sku } = await searchParams;
  const category = typeof type === "string" ? type : undefined;
  const subcategory = typeof sub === "string" ? sub : undefined;
  const childCategory = typeof child === "string" ? child : undefined;
  const skuQuery = typeof sku === "string" ? sku : undefined;
  const { products, categories, subcategories, children } = await listFilteredMachines({
    type: category,
    subcategory,
    childCategory,
    sku: skuQuery,
  });
  const filtering = Boolean(category || subcategory || childCategory || skuQuery);
  const machines = products.length || filtering ? products : catalogMachines;
  const categoryName = category
    ? categories.find((item) => item.value?.toLowerCase() === category.toLowerCase())?.label ??
      products[0]?.categoryName
    : undefined;

  return (
    <>
      <PageHero
        title={categoryName ?? "All Machines"}
        subtitle="Filter the full catalog by category, subcategory, child category, or SKU."
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[250px_1fr] lg:px-6">
        <CatalogFilters
          basePath="/machines"
          categories={categories}
          type={category}
          subcategories={subcategories}
          children={children}
          subcategory={subcategory}
          childCategory={childCategory}
          sku={skuQuery}
        />
        {machines.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No products match these filters.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {machines.map((machine) => (
              <MachineCard key={machine.slug} machine={machine} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
