import type { Metadata } from "next";
import { MachineCard } from "@/components/machine-card";
import { PageHero } from "@/components/page-hero";
import { machines as catalogMachines } from "@/lib/catalog";
import { listPublicMachines } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Used CNC Machines",
};
export const dynamic = "force-dynamic";

export default async function UsedMachinesPage() {
  const listed = await listPublicMachines({ used: true, kind: "MACHINE" });
  const used = listed.length ? listed : catalogMachines.filter((machine) => machine.used);

  return (
    <>
      <PageHero
        title="Used CNC Machines"
        subtitle="Verified, production-ready used machines sourced across India and overseas yards."
      />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {used.map((machine) => (
          <MachineCard key={machine.slug} machine={machine} />
        ))}
      </div>
    </>
  );
}
