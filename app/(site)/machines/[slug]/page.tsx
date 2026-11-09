import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product-actions";
import { ProductGallery } from "@/components/product-gallery";
import { ProductTabs } from "@/components/product-tabs";
import { PurchaseOptions } from "@/components/purchase-options";
import { SimilarMachines } from "@/components/similar-machines";
import { getMachine, machines as catalogMachines, whatsappLink, type Machine } from "@/lib/catalog";
import {
  getProductDetail,
  listRelatedMachines,
  overviewCopy,
  specEntries,
  type ProductDetail,
  type RelatedMachine,
} from "@/lib/site-content";
import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const highlights = [
  { title: "High Precision", text: "Consistent Accuracy" },
  { title: "High Productivity", text: "Optimized Performance" },
  { title: "Reliable Operation", text: "Proven Technology" },
  { title: "Versatile Applications", text: "Wide Industry Usage" },
];

const whyBuy = [
  { title: "Verified Machines", text: "Inspected & Tested" },
  { title: "Pan India Delivery", text: "Safe & Secure" },
  { title: "Expert Support", text: "Before & After Sales" },
  { title: "Best Market Price", text: "Value for Money" },
];

function catalogProduct(machine: Machine): ProductDetail {
  return {
    slug: machine.slug,
    name: machine.name,
    category: machine.type,
    categorySlug: "",
    type: machine.type,
    brand: machine.name.split(" ")[0] ?? "",
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
    used: machine.used,
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
  const text = value.trim();
  return text && text !== "—" ? text : "";
}

function videoEmbed(description: string) {
  const watch = description.match(/youtube\.com\/watch\?v=([\w-]{6,})/);
  const short = description.match(/youtu\.be\/([\w-]{6,})/);
  const embed = description.match(/youtube\.com\/embed\/([\w-]{6,})/);
  const id = watch?.[1] ?? short?.[1] ?? embed?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function specificationRows(product: ProductDetail) {
  const parsed = specEntries(product.description);
  const extras = [
    ["Controller", shown(product.controller)],
    ["Year of Manufacture", shown(product.year)],
    ["Condition", shown(product.condition)],
    ["Make", shown(product.brand)],
    ["Model", shown(product.model)],
    ["Location", shown(product.location)],
    ["Weight", shown(product.weight)],
    ["Capacity", shown(product.capacity)],
    ["Available quantity", product.stock > 0 ? String(product.stock) : ""],
  ];
  const seen = new Set(parsed.map((row) => row.label.toLowerCase()));
  const rows = [
    ...parsed,
    ...extras
      .filter((entry): entry is [string, string] => Boolean(entry[1]) && !seen.has(entry[0].toLowerCase()))
      .map(([label, value]) => ({ label, value })),
  ];
  if (rows.length) {
    return rows.slice(0, 14);
  }
  return [
    { label: "Category", value: product.category },
    { label: "Type", value: product.type || "CNC machine" },
  ];
}

function overviewText(product: ProductDetail) {
  const prose = overviewCopy(product.description);
  if (prose) {
    return prose;
  }
  const kind = shown(product.type) || product.category || "CNC machine";
  const condition = shown(product.condition) ? `${shown(product.condition).toLowerCase()} ` : "";
  const maker = shown(product.brand) ? ` from ${product.brand}` : "";
  const year = shown(product.year) ? `, ${product.year}` : "";
  const place = shown(product.location) ? ` It is listed from ${product.location}.` : "";
  return `The ${product.name} is a ${condition}${kind}${maker}${year}. It is inspected before listing and suited to production work across aerospace, automotive, mould and die, and general engineering.${place} TNCNC can arrange a yard visit, pan-India delivery, and installation support.`;
}

function catalogSimilar(product: ProductDetail): RelatedMachine[] {
  const same = catalogMachines.filter(
    (machine) => machine.slug !== product.slug && (machine.type === product.type || machine.type === product.category),
  );
  const pool = same.length >= 4 ? same : catalogMachines.filter((machine) => machine.slug !== product.slug);
  return pool.slice(0, 8).map((machine) => ({
    slug: machine.slug,
    name: machine.name,
    year: machine.year,
    location: machine.location,
    image: machine.image,
  }));
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

  const [salesPeople, settings, related] = await Promise.all([
    prisma.adminUser
      .findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { name: true } })
      .then((people) => people.map((person) => person.name))
      .catch(() => [] as string[]),
    getSiteSettings(),
    listRelatedMachines(product.slug, product.categorySlug),
  ]);

  const similar = related.length ? related : catalogSimilar(product);
  const listingHref = product.used ? "/used-machines" : "/machines";
  const listingLabel = product.used ? "Used Machines" : "CNC Machines";
  const categoryHref = product.categorySlug ? `/machines?type=${product.categorySlug}` : listingHref;
  const condition = shown(product.condition) || "Ask";
  const conditionGood = /excellent|good|verified|ready/i.test(condition);
  const facts = [
    ["Condition", condition, conditionGood],
    ["Year", shown(product.year) || "—", false],
    ["Location", shown(product.location) || "India", false],
    ["Make", shown(product.brand) || "—", false],
    ["Model", shown(product.model) || "—", false],
  ] as const;
  const phoneHref = `tel:${settings.phone.replace(/[^\d+]/g, "")}`;
  const brands = settings.brandsLine
    .split(",")
    .map((brand) => brand.trim())
    .filter(Boolean);

  return (
    <div className="bg-[#f4f6f8]">
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <span aria-hidden>›</span>
            <Link href={listingHref} className="hover:text-navy">
              {listingLabel}
            </Link>
            <span aria-hidden>›</span>
            <Link href={categoryHref} className="hover:text-navy">
              {product.category}
            </Link>
            <span aria-hidden>›</span>
            <span className="text-slate-700">{product.name}</span>
          </p>

          <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <ProductGallery images={product.images} name={product.name} />

            <div>
              <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                {product.used ? "Used Machine" : "CNC Machine"}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{product.name}</h1>
              <p className="mt-1 text-lg text-slate-500">{shown(product.type) || product.category}</p>
              <p className="mt-2 text-2xl font-extrabold text-navy">{money(product.price)}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Trust icon="shield" title="Verified Machine" text="Quality Checked" />
                <Trust icon="check" title="Ready for Production" text="Tested & Inspected" />
                <Trust icon="truck" title="Pan India Delivery" text="Available" />
              </div>

              <div className="mt-5 grid items-start gap-4 xl:grid-cols-[1fr_240px]">
                <dl className="divide-y divide-slate-200 border-y border-slate-200">
                  {facts.map(([label, value, accent]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className={`font-bold ${accent ? "text-emerald-600" : "text-navy"}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <ProductActions
                  name={product.name}
                  quoteHref={`/quote?item=${encodeURIComponent(product.name)}`}
                  whatsappHref={whatsappLink(`Hi TNCNC, I am interested in ${product.name}.`)}
                  phone={settings.phone}
                  phoneHref={phoneHref}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
        <PurchaseOptions
          slug={product.slug}
          name={product.name}
          price={product.price}
          salesPeople={salesPeople}
        />

        <ProductTabs
          name={product.name}
          slug={product.slug}
          overview={overviewText(product)}
          highlights={highlights}
          specs={specificationRows(product)}
          images={product.images}
          videoUrl={videoEmbed(product.description)}
          price={product.price}
          salesPeople={salesPeople}
        />

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <h2 className="px-2 text-lg font-extrabold text-navy">Why Buy from TN CNC</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyBuy.map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
                  <WhyIcon title={item.title} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-navy">{item.title}</span>
                  <span className="block text-xs text-slate-500">{item.text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <SimilarMachines
          machines={similar}
          viewAllHref={categoryHref}
          viewAllLabel={`View All ${product.category}`}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <Promo
            title={settings.sellTitle}
            text={settings.sellText}
            href="/sell"
            label="List Now →"
            image="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80"
          />
          <Promo
            title={settings.sourceTitle}
            text={settings.sourceText}
            href="/quote"
            label="Request Now →"
            image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80"
          />
          <Promo
            title={settings.serviceTitle}
            text={settings.serviceText}
            href="/services"
            label="Contact Us →"
            image="https://images.unsplash.com/photo-1581092918484-8313ade1f7e8?auto=format&fit=crop&w=900&q=80"
          />
        </section>

        <section className="rounded-xl bg-white px-4 py-8">
          <h2 className="text-center text-lg font-bold text-navy">Trusted Brands We Deal</h2>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold tracking-wide text-slate-500 sm:text-base">
            {brands.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Trust({ icon, title, text }: { icon: "shield" | "check" | "truck"; title: string; text: string }) {
  const path =
    icon === "shield"
      ? "M12 2 4 5v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V5l-8-3Zm-1 13-3.5-3.5 1.4-1.4L11 12.2l4.1-4.1 1.4 1.4L11 15Z"
      : icon === "check"
        ? "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z"
        : "M3 7h11v7h2.2l1.5-3H22v2h-3l-2 4H7v2H5v-2H3V7Zm2 2v3h9V9H5Zm13 9a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 18 18ZM8 18a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8 18Z";
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-navy">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d={path} />
        </svg>
      </span>
      <span>
        <span className="block text-xs font-bold leading-4 text-navy">{title}</span>
        <span className="block text-[11px] text-slate-500">{text}</span>
      </span>
    </div>
  );
}

function WhyIcon({ title }: { title: string }) {
  const path =
    title === "Verified Machines"
      ? "M12 2 4 5v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V5l-8-3Zm-1 13-3.5-3.5 1.4-1.4L11 12.2l4.1-4.1 1.4 1.4L11 15Z"
      : title === "Pan India Delivery"
        ? "M3 7h11v7h2.2l1.5-3H22v2h-3l-2 4H7v2H5v-2H3V7Z"
        : title === "Expert Support"
          ? "M12 3a7 7 0 0 0-7 7v3H4v4h4v-4H7v-3a5 5 0 0 1 10 0v3h-1v4h4v-4h-1v-3a7 7 0 0 0-7-7Z"
          : "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Z";
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d={path} />
    </svg>
  );
}

function Promo({
  title,
  text,
  href,
  label,
  image,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
  image: string;
}) {
  return (
    <div className="relative min-h-44 overflow-hidden rounded-xl text-white">
      <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
      <div className="absolute inset-0 bg-navy/75" />
      <div className="relative p-6">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-white/80">{text}</p>
        <Link href={href} className="mt-4 inline-block rounded bg-gold px-4 py-2 text-sm font-bold text-navy">
          {label}
        </Link>
      </div>
    </div>
  );
}
