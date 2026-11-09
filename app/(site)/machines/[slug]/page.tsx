import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { PurchaseOptions } from "@/components/purchase-options";
import { getMachine, type Machine } from "@/lib/catalog";
import { getProductDetail, type ProductDetail } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function catalogProduct(machine: Machine): ProductDetail {
  return {
    slug: machine.slug,
    name: machine.name,
    category: machine.type,
    categorySlug: "",
    type: machine.type,
    brand: "",
    model: "",
    controller: machine.control,
    year: machine.year === "—" ? "" : machine.year,
    condition: machine.condition === "—" ? "" : machine.condition,
    location: machine.location === "—" ? "" : machine.location,
    stock: 1,
    price: null,
    description: machine.description,
    images: [machine.image],
    weight: "",
    capacity: "",
    arrival: "",
    featured: machine.featured,
  };
}

function money(price: number | null) {
  if (price == null) {
    return "Price on request";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function shown(value: string) {
  return value.trim() || "—";
}

export async function generateMetadata({
  params,
}: PageProps<"/machines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProductDetail(slug)) ?? catalogFallback(slug);
  return { title: product?.name ?? "Machine" };
}

function catalogFallback(slug: string) {
  const machine = getMachine(slug);
  return machine ? catalogProduct(machine) : null;
}

export default async function MachineDetailPage({
  params,
}: PageProps<"/machines/[slug]">) {
  const { slug } = await params;
  const product = (await getProductDetail(slug)) ?? catalogFallback(slug);
  if (!product) {
    notFound();
  }
  const salesPeople = await prisma.adminUser
    .findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { name: true } })
    .then((people) => people.map((person) => person.name))
    .catch(() => []);

  const facts = [
    ["Inventory number", product.slug],
    ["Manufacturer", shown(product.brand)],
    ["Model number", shown(product.model)],
    ["Controller", shown(product.controller)],
    ["Product name", product.name],
    ["Category", product.category],
    ["Listed", shown(product.arrival)],
    ["Condition", shown(product.condition)],
    ["Type", shown(product.type)],
    ["Weight", shown(product.weight)],
    ["Capacity", shown(product.capacity)],
    ["Make year", shown(product.year)],
    ["Available quantity", String(product.stock)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        <Link href="/" className="hover:text-navy">
          Home
        </Link>
        {" / "}
        <Link href="/machines" className="hover:text-navy">
          {product.category}
        </Link>
        {product.type ? ` / ${product.type}` : null}
      </p>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          {product.featured ? (
            <span className="inline-block rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              Featured
            </span>
          ) : null}
          <h1 className="mt-2 text-3xl font-extrabold text-navy">{product.name}</h1>
          <div className="mt-4">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fulfillment</p>
            <h2 className="text-lg font-bold text-navy">Pickup and item location</h2>
            <p className="mt-1 text-sm text-slate-500">Confirm where this item is stored before arranging pickup.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-emerald-700">
                  {product.stock > 0 ? `In stock · ${product.stock}` : "Ask for availability"}
                </p>
                <p className="mt-1 text-slate-600">{shown(product.location)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                Inspection at the TNCNC yard. Call or WhatsApp to schedule a visit.
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-3xl font-extrabold text-navy">{money(product.price)}</p>
            <p className="mt-1 text-sm text-slate-500">Quote confirmed by the TNCNC sales desk</p>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipment profile</p>
              <h2 className="text-lg font-bold text-navy">Item information</h2>
            </div>
            <dl className="grid grid-cols-2 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="border-b border-slate-100 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-medium text-navy">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="bg-amber-50 px-5 py-3 text-sm">
              <p className="font-semibold text-navy">Item details</p>
              <p className="mt-1 whitespace-pre-line text-slate-700">
                {product.description.trim() || "Ask TNCNC for the full specification sheet."}
              </p>
            </div>
          </section>

          <PurchaseOptions
            slug={product.slug}
            name={product.name}
            price={product.price}
            salesPeople={salesPeople}
          />
        </div>
      </div>
    </div>
  );
}
