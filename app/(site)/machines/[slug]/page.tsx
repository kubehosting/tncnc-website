import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/enquiry-form";
import { getMachine, whatsappLink } from "@/lib/catalog";
import { getPublicMachine } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/machines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const machine = (await getPublicMachine(slug)) ?? getMachine(slug);
  return { title: machine?.name ?? "Machine" };
}

export default async function MachineDetailPage({
  params,
}: PageProps<"/machines/[slug]">) {
  const { slug } = await params;
  const machine = (await getPublicMachine(slug)) ?? getMachine(slug);
  if (!machine) notFound();

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-6">
      <article className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="relative h-80">
          <Image
            src={machine.image}
            alt={machine.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500">{machine.type}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">
            {machine.name}
          </h1>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>Year: {machine.year}</div>
            <div>Control: {machine.control}</div>
            <div>Condition: {machine.condition}</div>
            <div>Location: {machine.location}</div>
          </dl>
          <p className="mt-4 text-slate-600">{machine.description}</p>
          <a
            href={whatsappLink(`Hi TNCNC, I want details on ${machine.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white"
          >
            WhatsApp this machine
          </a>
        </div>
      </article>
      <aside className="rounded-lg bg-white p-6 shadow-sm">
        <EnquiryForm heading="Request a quote" submitLabel="Send request" />
        <Link href="/used-machines" className="mt-6 inline-block text-sm text-navy">
          ← Back to machines
        </Link>
      </aside>
    </div>
  );
}
