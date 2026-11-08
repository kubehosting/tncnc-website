import type { CategoryKind } from "@prisma/client";
import { categoryHref, categorySeed } from "@/lib/category-seed";
import type { Machine } from "@/lib/catalog";
import { machines as catalogMachines } from "@/lib/catalog";
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
    image:
      machine.images[0]?.url ??
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80",
    featured: machine.featured,
    used: machine.used,
    description: machine.description ?? "",
  };
}

export async function getHomeContent() {
  try {
    const [dbCategories, dbFeatured] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.machine.findMany({
        where: { featured: true, used: true, status: "AVAILABLE" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: listingInclude,
      }),
    ]);

    const machineCategories: HomeCategory[] = (
      dbCategories.length
        ? dbCategories.filter((category) => category.kind === "MACHINE")
        : categorySeed.filter((category) => category.kind === "MACHINE")
    ).map((category) => ({
      slug: category.slug,
      name: category.name,
      imageUrl: category.imageUrl,
      href: categoryHref(category.slug, category.kind),
    }));

    const spareCategories: HomeCategory[] = (
      dbCategories.length
        ? dbCategories.filter((category) => category.kind === "SPARE")
        : categorySeed.filter((category) => category.kind === "SPARE")
    ).map((category) => ({
      slug: category.slug,
      name: category.name,
      imageUrl: category.imageUrl,
      href: categoryHref(category.slug, category.kind),
    }));

    const featured =
      dbFeatured.length > 0
        ? dbFeatured.map(toListingMachine)
        : catalogMachines.filter((machine) => machine.featured).slice(0, 4);

    return { machineCategories, spareCategories, featured };
  } catch (error) {
    console.error("Could not load homepage catalog from the database.", error);
    return {
      machineCategories: categorySeed
        .filter((category) => category.kind === "MACHINE")
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          imageUrl: category.imageUrl,
          href: categoryHref(category.slug, category.kind),
        })),
      spareCategories: categorySeed
        .filter((category) => category.kind === "SPARE")
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          imageUrl: category.imageUrl,
          href: categoryHref(category.slug, category.kind),
        })),
      featured: catalogMachines.filter((machine) => machine.featured).slice(0, 4),
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
      return categories;
    }
  } catch (error) {
    console.error("Could not list categories from the database.", error);
  }
  return categorySeed.filter((category) => (kind ? category.kind === kind : true));
}
