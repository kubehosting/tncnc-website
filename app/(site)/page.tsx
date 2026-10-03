import Link from "next/link";
import Image from "next/image";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { MachineCard } from "@/components/machine-card";
import { parseHeroSlides } from "@/lib/hero-slides";
import type { HomeCategory } from "@/lib/site-content";
import { getHomeContent } from "@/lib/site-content";
import { getSiteSettings } from "@/lib/site-settings";
import type { Machine } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const trust = [
  {
    title: "Wide Inventory",
    text: "Machines & Spares",
    icon: (
      <path d="M4 7h16v10H4zM8 7V5h8v2M7 17v3h2v-3m6 0v3h2v-3" />
    ),
  },
  {
    title: "Verified Machines",
    text: "Quality Checked",
    icon: (
      <path d="M12 3 4 7v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V7l-8-4Zm-1 13-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7Z" />
    ),
  },
  {
    title: "Best Market Price",
    text: "Value for Money",
    icon: (
      <path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 4v2.1A3 3 0 0 1 15 12h-4a1 1 0 0 0 0 2h6v2h-3v2h-2v-2H9v-2h2.1A3 3 0 0 1 9 12h4a1 1 0 0 0 0-2H7V8h4V6h2Z" />
    ),
  },
  {
    title: "Expert Support",
    text: "Before & After Sales",
    icon: (
      <path d="M12 3a7 7 0 0 0-7 7v3H4v4h4v-4H7v-3a5 5 0 0 1 10 0v3h-1v4h4v-4h-1v-3a7 7 0 0 0-7-7Z" />
    ),
  },
  {
    title: "Pan India Delivery",
    text: "Global Shipping",
    icon: (
      <path d="M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12Zm9-7v2m0 12v2M5 12H3m18 0h-2m-1.6-6.4 1.4-1.4M6.2 17.8 4.8 19.2m12.6 0 1.4 1.4M6.2 6.2 4.8 4.8M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
    ),
  },
];

export default async function Home() {
  const [{ machineCategories, spareCategories, featured }, settings] = await Promise.all([
    getHomeContent(),
    getSiteSettings(),
  ]);

  return (
    <>
      <HomeHeroSlider
        slides={parseHeroSlides(settings.heroSlidesJson)}
        badges={[settings.heroBadge1, settings.heroBadge2, settings.heroBadge3].filter(Boolean)}
        intervalMs={Math.max(3, Number(settings.heroSliderSeconds) || 6) * 1000}
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-3 px-4 py-8 sm:grid-cols-5 lg:grid-cols-9 lg:px-6">
          {machineCategories.map((category) => (
            <CategoryTile key={category.slug} category={category} round />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-navy">
              {settings.featuredHeading}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {settings.featuredSubheading}
            </p>
          </div>
          <Link
            href="/used-machines"
            className="hidden text-sm font-semibold text-navy hover:underline sm:block"
          >
            View All Machines →
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((machine: Machine) => (
              <MachineCard key={machine.slug} machine={machine} />
            ))}
          </div>
          <aside className="relative overflow-hidden rounded-lg text-white">
            <Image
              src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80"
              alt="Global shipping containers"
              fill
              className="object-cover"
              sizes="280px"
            />
            <div className="absolute inset-0 bg-navy/75" />
            <div className="relative flex h-full min-h-64 flex-col justify-end p-6">
              <p className="text-2xl font-extrabold leading-snug whitespace-pre-line">
                {settings.importHeading}
              </p>
              <p className="mt-3 text-sm text-white/80">{settings.importText}</p>
              <Link
                href="/quote"
                className="mt-5 inline-block w-fit rounded bg-gold px-4 py-2 text-sm font-bold text-navy"
              >
                Enquire Now →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-navy">{settings.spareHeading}</h2>
              <p className="mt-1 text-sm text-slate-600">{settings.spareSubheading}</p>
            </div>
            <Link
              href="/spare-parts"
              className="text-sm font-semibold text-navy hover:underline"
            >
              View All Spare Parts →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
            {spareCategories.map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {trust.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm"
            >
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-gold">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  {item.icon}
                </svg>
              </span>
              <div>
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-12 lg:grid-cols-3 lg:px-6">
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

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <h2 className="text-center text-lg font-bold text-navy">
            Trusted Brands We Deal
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-semibold tracking-wide text-slate-500">
            {settings.brandsLine
              .split(",")
              .map((brand) => brand.trim())
              .filter(Boolean)
              .map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CategoryTile({
  category,
  round = false,
}: {
  category: HomeCategory;
  round?: boolean;
}) {
  return (
    <Link
      href={category.href}
      className="group flex flex-col items-center gap-2 p-2 text-center"
    >
      <span
        className={`relative overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition group-hover:border-gold group-hover:shadow-md ${
          round ? "h-16 w-16 rounded-full" : "h-20 w-20 rounded-lg"
        }`}
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[10px] text-slate-400">
            Photo
          </span>
        )}
      </span>
      <span className="text-xs font-medium text-navy">{category.name}</span>
    </Link>
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
    <div className="relative min-h-48 overflow-hidden rounded-lg text-white">
      <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
      <div className="absolute inset-0 bg-navy/78" />
      <div className="relative p-6">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-white/80">{text}</p>
        <Link
          href={href}
          className="mt-4 inline-block rounded bg-gold px-4 py-2 text-sm font-bold text-navy"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
