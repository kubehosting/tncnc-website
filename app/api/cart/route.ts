import { jsonOk, prismaError } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slugs = [
    ...new Set(
      (new URL(request.url).searchParams.get("slugs") ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ].slice(0, 40);

  try {
    const settings = await getSiteSettings();
    const taxRate = Number(settings.gstRate);
    const machines = slugs.length
      ? await prisma.machine.findMany({
          where: { slug: { in: slugs } },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        })
      : [];
    const bySlug = new Map(machines.map((machine) => [machine.slug, machine]));
    return jsonOk({
      taxRate: Number.isFinite(taxRate) ? taxRate : 18,
      items: slugs.map((slug) => {
        const machine = bySlug.get(slug);
        if (!machine) {
          return { slug, name: "No longer listed", price: null, stock: 0, image: null, available: false };
        }
        return {
          slug,
          name: machine.name,
          price: machine.price != null ? Number(machine.price) : null,
          stock: machine.stock,
          image: machine.images[0]?.url ?? null,
          available: machine.status === "AVAILABLE" && machine.stock > 0,
        };
      }),
    });
  } catch (error) {
    return prismaError(error);
  }
}
