import type { Metadata } from "next";
import { CatalogFilters } from "@/components/catalog-filters";
import { MachineCard } from "@/components/machine-card";
import { PageHero } from "@/components/page-hero";
import { machines as catalogMachines } from "@/lib/catalog";
import { listFilteredMachines } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "CNC Machines",
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
  const { products, subcategories, children } = await listFilteredMachines({
    type: category,
    kind: category ? undefined : "MACHINE",
    subcategory,
    childCategory,
    sku: skuQuery,
  });
  const filtering = Boolean(category || subcategory || childCategory || skuQuery);
  const machines = products.length || filtering ? products : catalogMachines;
  const categoryName = products[0]?.categoryName;

  return (
    <>
      <PageHero
        title={categoryName ?? "CNC Machines"}
        subtitle="Choose a category, then use the filters to narrow by subcategory, child category, or SKU."
      />
      <div
        className={`mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:px-6 ${
          category ? "lg:grid-cols-[250px_1fr]" : ""
        }`}
      >
        {category ? (
          <CatalogFilters
            basePath="/machines"
            type={category}
            subcategories={subcategories}
            children={children}
            subcategory={subcategory}
            childCategory={childCategory}
            sku={skuQuery}
          />
        ) : null}
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
