import type { CategoryKind } from "@prisma/client";
import { categoryHref, categorySeed } from "@/lib/category-seed";
import type { Machine } from "@/lib/catalog";
import { machines as catalogMachines } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media-url";
import { prisma } from "@/lib/prisma";

export type HomeCategory = {
  slug: string;
  name: string;
  imageUrl: string | null;
  href: string;
};

const listingInclude = {
  category: { select: { name: true, slug: true, kind: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
};

export function toListingMachine(machine: {
  slug: string;
  name: string;
  year: number | null;
  controller: string | null;
  condition: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  featured: boolean;
  used: boolean;
  images: { url: string }[];
  category: { name: string };
}): Machine {
  return {
    slug: machine.slug,
    name: machine.name,
    type: machine.type ?? machine.category.name,
    year: machine.year != null ? String(machine.year) : "—",
    control: machine.controller ?? "—",
    condition: machine.condition ?? "—",
    location: machine.location ?? "—",
    image: machine.images[0]?.url
      ? mediaUrl(machine.images[0].url)
      : "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80",
    featured: machine.featured,
    used: machine.used,
    description: machine.description ?? "",
  };
}

export async function getHomeContent() {
  try {
    const [dbCategories, dbFeatured, listedCount] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.machine.findMany({
        where: { featured: true, used: true, status: "AVAILABLE" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: listingInclude,
      }),
      prisma.machine.count({ where: { status: "AVAILABLE" } }),
    ]);

    const machineCategories: HomeCategory[] = (
      dbCategories.length
        ? dbCategories.filter((category) => category.kind === "MACHINE")
        : categorySeed.filter((category) => category.kind === "MACHINE")
    ).map((category) => ({
      slug: category.slug,
      name: category.name,
      imageUrl: category.imageUrl ? mediaUrl(category.imageUrl) : category.imageUrl,
      href: categoryHref(category.slug, category.kind),
    }));

    const spareCategories: HomeCategory[] = (
      dbCategories.length
        ? dbCategories.filter((category) => category.kind === "SPARE")
        : categorySeed.filter((category) => category.kind === "SPARE")
    ).map((category) => ({
      slug: category.slug,
      name: category.name,
      imageUrl: category.imageUrl ? mediaUrl(category.imageUrl) : category.imageUrl,
      href: categoryHref(category.slug, category.kind),
    }));

    const featured =
      dbFeatured.length > 0
        ? dbFeatured.map(toListingMachine)
        : catalogMachines.filter((machine) => machine.featured).slice(0, 4);

    return { machineCategories, spareCategories, featured, productCount: listedCount };
  } catch (error) {
    console.error("Could not load homepage catalog from the database.", error);
    return {
      machineCategories: categorySeed
        .filter((category) => category.kind === "MACHINE")
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          imageUrl: category.imageUrl ? mediaUrl(category.imageUrl) : category.imageUrl,
          href: categoryHref(category.slug, category.kind),
        })),
      spareCategories: categorySeed
        .filter((category) => category.kind === "SPARE")
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          imageUrl: category.imageUrl ? mediaUrl(category.imageUrl) : category.imageUrl,
          href: categoryHref(category.slug, category.kind),
        })),
      featured: catalogMachines.filter((machine) => machine.featured).slice(0, 4),
      productCount: catalogMachines.length,
    };
  }
}

export async function listPublicMachines(options?: {
  used?: boolean;
  type?: string;
  kind?: CategoryKind;
}) {
  try {
    const machines = await prisma.machine.findMany({
      where: {
        status: "AVAILABLE",
        used: options?.used,
        category: options?.type
          ? { slug: options.type }
          : options?.kind
            ? { kind: options.kind }
            : undefined,
      },
      orderBy: { featured: "desc" },
      include: listingInclude,
    });
    return machines.map(toListingMachine);
  } catch (error) {
    console.error("Could not list machines from the database.", error);
    return [];
  }
}

export async function searchPublicMachines(query: string, limit = 24) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) {
    return [];
  }
  const matches = (values: Array<string | number | null | undefined>) =>
    values
      .filter((value) => value != null && String(value).trim() !== "")
      .join(" ")
      .toLowerCase()
      .includes(needle);

  try {
    const machines = await prisma.machine.findMany({
      where: { status: "AVAILABLE" },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: listingInclude,
    });
    return machines
      .filter((machine) =>
        matches([
          machine.name,
          machine.brand,
          machine.type,
          machine.controller,
          machine.location,
          machine.condition,
          machine.category.name,
          machine.slug,
          machine.year,
        ]),
      )
      .slice(0, limit)
      .map(toListingMachine);
  } catch (error) {
    console.error("Could not search the catalog.", error);
    return catalogMachines
      .filter((machine) =>
        matches([
          machine.name,
          machine.type,
          machine.control,
          machine.location,
          machine.condition,
          machine.year,
          machine.slug,
        ]),
      )
      .slice(0, limit);
  }
}

export type ProductDetail = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  type: string;
  brand: string;
  model: string;
  controller: string;
  year: string;
  condition: string;
  location: string;
  stock: number;
  price: number | null;
  description: string;
  images: string[];
  weight: string;
  capacity: string;
  arrival: string;
  featured: boolean;
  used: boolean;
};

function specValue(specs: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = specs[key];
    if (value) {
      return value;
    }
  }
  return "";
}

function descriptionSpecs(description: string) {
  const specs: Record<string, string> = {};
  for (const line of description.split(/\r?\n/)) {
    const match = /^([^:\t]{2,48})[:\t]\s*(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const key = match[1]
      .trim()
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    specs[key] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return specs;
}

export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  try {
    const machine = await prisma.machine.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!machine) {
      return null;
    }
    const specs = descriptionSpecs(machine.description ?? "");
    const yearFromSpec = /(\d{4})/.exec(specValue(specs, ["year of mfg", "year of manufacture"]))?.[1];
    return {
      slug: machine.slug,
      name: machine.name,
      category: machine.category.name,
      categorySlug: machine.category.slug,
      type: machine.type ?? specValue(specs, ["category"]) ?? machine.category.name,
      brand: machine.brand ?? specValue(specs, ["manufacturer"]) ?? "",
      model: specValue(specs, ["model number", "model"]),
      controller: machine.controller ?? specValue(specs, ["controller"]) ?? "",
      year: machine.year != null ? String(machine.year) : (yearFromSpec ?? ""),
      condition: machine.condition ?? specValue(specs, ["condition"]) ?? "",
      location: machine.location ?? specValue(specs, ["location"]) ?? "",
      stock: machine.stock,
      price: machine.price != null ? Number(machine.price) : null,
      description: machine.description ?? "",
      images: machine.images.map((image) => mediaUrl(image.url)),
      weight: specValue(specs, ["weight"]),
      capacity: specValue(specs, ["working capacity", "capacity"]),
      arrival: machine.createdAt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      featured: machine.featured,
      used: machine.used,
    };
  } catch (error) {
    console.error("Could not load product details from the database.", error);
    return null;
  }
}

export type RelatedMachine = {
  slug: string;
  name: string;
  year: string;
  location: string;
  image: string;
};

export function specEntries(description: string) {
  const rows: { label: string; value: string }[] = [];
  for (const line of description.split(/\r?\n/)) {
    const match = /^([^:\t]{2,60})[:\t]\s*(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!value) {
      continue;
    }
    rows.push({ label: match[1].trim(), value });
  }
  return rows;
}

export function overviewCopy(description: string) {
  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^([^:\t]{2,60})[:\t]\s*.+$/.test(line))
    .join("\n\n");
}

export async function listRelatedMachines(currentSlug: string, categorySlug: string) {
  try {
    const include = {
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    };
    const primary = await prisma.machine.findMany({
      where: {
        status: "AVAILABLE",
        slug: { not: currentSlug },
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include,
    });
    const extra =
      primary.length > 0
        ? []
        : await prisma.machine.findMany({
            where: {
              status: "AVAILABLE",
              slug: { not: currentSlug },
            },
            orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
            take: 8,
            include,
          });
    return [...primary, ...extra].map(
      (machine): RelatedMachine => ({
        slug: machine.slug,
        name: machine.name,
        year: machine.year != null ? String(machine.year) : "—",
        location: machine.location ?? "India",
        image: machine.images[0]?.url
          ? mediaUrl(machine.images[0].url)
          : "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80",
      }),
    );
  } catch (error) {
    console.error("Could not load related machines.", error);
    return [];
  }
}

export async function getPublicMachine(slug: string) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    return machine ? toListingMachine(machine) : null;
  } catch (error) {
    console.error("Could not load machine from the database.", error);
    return null;
  }
}

export async function listPublicCategories(kind?: CategoryKind) {
  try {
    const categories = await prisma.category.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (categories.length) {
      return categories.map((category) => ({
        ...category,
        imageUrl: category.imageUrl ? mediaUrl(category.imageUrl) : category.imageUrl,
      }));
    }
  } catch (error) {
    console.error("Could not list categories from the database.", error);
  }
  return categorySeed.filter((category) => (kind ? category.kind === kind : true));
}
