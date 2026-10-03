import type { Metadata } from "next";
import { MachineCard } from "@/components/machine-card";
import { PageHero } from "@/components/page-hero";
import { machines as catalogMachines } from "@/lib/catalog";
import { listPublicMachines } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "CNC Machines",
};
export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: PageProps<"/machines">) {
  const { type } = await searchParams;
  const listed = await listPublicMachines({
    type: typeof type === "string" ? type : undefined,
    kind: type ? undefined : "MACHINE",
  });
  const machines = listed.length ? listed : catalogMachines;

  return (
    <>
      <PageHero
        title="CNC Machines"
        subtitle="Lathes, VMCs, HMCs, turning centers, grinding, EDM, press brakes, and laser machines."
      />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {machines.map((machine) => (
          <MachineCard key={machine.slug} machine={machine} />
        ))}
      </div>
    </>
  );
}
