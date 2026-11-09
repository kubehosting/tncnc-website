import { jsonOk } from "@/lib/admin-api";
import { searchPublicMachines } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const machines = await searchPublicMachines(query, 8);
  return jsonOk({
    machines: machines.map((machine) => ({
      slug: machine.slug,
      name: machine.name,
      type: machine.type,
      year: machine.year,
      location: machine.location,
      image: machine.image,
    })),
  });
}
