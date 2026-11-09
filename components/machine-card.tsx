import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { Machine } from "@/lib/catalog";
import { whatsappLink } from "@/lib/catalog";

export function MachineCard({ machine }: { machine: Machine }) {
  const href = `/machines/${machine.slug}`;
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Link href={href} className="relative block h-44 bg-slate-100">
        <Image
          src={machine.image}
          alt={machine.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </Link>
      <div className="p-4">
        <h3 className="font-semibold text-navy">
          <Link href={href} className="hover:underline">
            {machine.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate-600">{machine.type}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Year {machine.year} | {machine.control}
          <br />
          Condition: {machine.condition}
          <br />
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
            </svg>
            {machine.location}
          </span>
        </p>
        <div className="mt-4 grid gap-2">
          <AddToCartButton slug={machine.slug} />
          <div className="flex items-center justify-between gap-2">
            <Link href={href} className="text-sm font-semibold text-navy underline-offset-2 hover:underline">
              View Details
            </Link>
            <a
              href={whatsappLink(`Hi TNCNC, I want details on ${machine.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
