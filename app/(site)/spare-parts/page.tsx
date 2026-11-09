import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CatalogFilters } from "@/components/catalog-filters";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero } from "@/components/page-hero";
import { MachineCard } from "@/components/machine-card";
import { spareParts as catalogSpares } from "@/lib/catalog";
import { listFilteredMachines, listPublicCategories } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Spare Parts",
};
export const dynamic = "force-dynamic";

export default async function SparePartsPage({
  searchParams,
}: PageProps<"/spare-parts">) {
  const { type, sub, child, sku } = await searchParams;
  const categories = await listPublicCategories("SPARE");
  const selected =
    typeof type === "string"
      ? categories.filter((category) => category.slug === type)
      : categories;
  const parts = (selected.length ? selected : categories).map((part) => ({
    slug: part.slug,
    name: part.name,
    imageUrl: part.imageUrl,
  }));
  const display =
    parts.length > 0
      ? parts
      : catalogSpares.map((part) => ({
          slug: part.slug,
          name: part.name,
          imageUrl: null as string | null,
        }));
  const category = typeof type === "string" ? type : undefined;
  const subcategory = typeof sub === "string" ? sub : undefined;
  const childCategory = typeof child === "string" ? child : undefined;
  const skuQuery = typeof sku === "string" ? sku : undefined;
  const { products, subcategories, children } = category
    ? await listFilteredMachines({ type: category, subcategory, childCategory, sku: skuQuery })
    : { products: [], subcategories: [], children: [] };

  return (
    <>
      <PageHero
        title="CNC Spare Parts"
        subtitle="Genuine and compatible FANUC, Siemens, Mitsubishi, Yaskawa parts with ready stock."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px] lg:px-6">
        <div className="space-y-8">
        {category ? (
          <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
            <CatalogFilters
              basePath="/spare-parts"
              type={category}
              subcategories={subcategories}
              children={children}
              subcategory={subcategory}
              childCategory={childCategory}
              sku={skuQuery}
            />
            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {products.map((machine) => (
                  <MachineCard key={machine.slug} machine={machine} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                No products match these filters.
              </p>
            )}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {display.map((part) => (
            <Link
              key={part.slug}
              href={`/spare-parts?type=${part.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm hover:border-gold"
            >
              <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
                {part.imageUrl ? (
                  <Image
                    src={part.imageUrl}
                    alt={part.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <p className="font-semibold text-navy">{part.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Tested | Ready stock | Quote on request
              </p>
            </Link>
          ))}
        </div>
        </div>
        <div className="h-fit rounded-lg bg-white p-6 shadow-sm">
          <EnquiryForm heading="Enquire for a part" />
        </div>
      </div>
    </>
  );
}
