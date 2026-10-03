import { PrismaClient } from "@prisma/client";
import { categorySeed } from "../lib/category-seed";
import { machines } from "../lib/catalog";

const prisma = new PrismaClient();

function categoryForType(type: string, used: boolean) {
  if (!used) {
    return "spare-parts";
  }
  const lower = type.toLowerCase();
  if (lower.includes("turning") || lower.includes("lathe")) {
    return "cnc-turning";
  }
  if (lower.includes("vertical") || lower.includes("tapping") || lower.includes("vmc")) {
    return "vmc";
  }
  if (lower.includes("horizontal") || lower.includes("hmc")) {
    return "hmc";
  }
  if (lower.includes("edm")) {
    return "edm";
  }
  if (lower.includes("grind")) {
    return "grinding";
  }
  if (lower.includes("press") || lower.includes("brake")) {
    return "press-brake";
  }
  if (lower.includes("laser")) {
    return "laser-machine";
  }
  return "cnc-lathe";
}

async function main() {
  for (const category of categorySeed) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        kind: category.kind,
        sortOrder: category.sortOrder,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        kind: category.kind,
        sortOrder: category.sortOrder,
      },
    });
  }

  for (const machine of machines) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: categoryForType(machine.type, machine.used) },
    });
    await prisma.machine.upsert({
      where: { slug: machine.slug },
      update: {
        name: machine.name,
        year: Number(machine.year) || null,
        controller: machine.control,
        condition: machine.condition,
        location: machine.location,
        brand: machine.name.split(" ")[0] ?? null,
        stock: 1,
        type: machine.type,
        description: machine.description,
        featured: machine.featured,
        used: machine.used,
        categoryId: category.id,
      },
      create: {
        slug: machine.slug,
        name: machine.name,
        year: Number(machine.year) || null,
        controller: machine.control,
        condition: machine.condition,
        location: machine.location,
        brand: machine.name.split(" ")[0] ?? null,
        stock: 1,
        type: machine.type,
        description: machine.description,
        featured: machine.featured,
        used: machine.used,
        categoryId: category.id,
        images: {
          create: [{ url: machine.image, alt: machine.name, sortOrder: 0 }],
        },
      },
    });
  }

  await prisma.customer.upsert({
    where: { id: "seed-customer-demo" },
    update: {},
    create: {
      id: "seed-customer-demo",
      name: "Aarav Manufacturing",
      email: "purchasing@aaravmfg.example",
      phone: "+91 98765 43210",
      company: "Aarav Manufacturing Pvt Ltd",
      address: "Ambattur Industrial Estate, Chennai",
    },
  });

  for (const region of [
    { name: "Tamil Nadu", country: "India", sortOrder: 1 },
    { name: "Karnataka", country: "India", sortOrder: 2 },
    { name: "Maharashtra", country: "India", sortOrder: 3 },
  ]) {
    await prisma.serviceRegion.upsert({
      where: { id: `region-${region.name.toLowerCase().replaceAll(" ", "-")}` },
      update: region,
      create: {
        id: `region-${region.name.toLowerCase().replaceAll(" ", "-")}`,
        ...region,
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "TNCNC10" },
    update: { percent: 10, active: true, note: "Introductory enquiry discount" },
    create: {
      code: "TNCNC10",
      percent: 10,
      active: true,
      note: "Introductory enquiry discount",
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "how-we-inspect-used-cnc-machines" },
    update: {},
    create: {
      title: "How we inspect used CNC machines",
      slug: "how-we-inspect-used-cnc-machines",
      body: "Every listed machine is checked for spindle condition, control health, and production readiness before it goes on the TNCNC floor.",
      published: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
