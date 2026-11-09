"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { RelatedMachine } from "@/lib/site-content";
import { whatsappLink } from "@/lib/catalog";

export function SimilarMachines({
  machines,
  viewAllHref,
  viewAllLabel,
}: {
  machines: RelatedMachine[];
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    scroller.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  if (!machines.length) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-navy">Similar Machines You May Like</h2>
        <Link href={viewAllHref} className="shrink-0 text-sm font-semibold text-navy hover:underline">
          {viewAllLabel} →
        </Link>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Previous machines"
          onClick={() => move(-1)}
          className="absolute left-0 top-24 z-10 hidden h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg text-navy shadow sm:grid"
        >
          ‹
        </button>
        <div ref={scroller} className="flex gap-4 overflow-x-auto scroll-smooth pb-2">
          {machines.map((machine) => (
            <article
              key={machine.slug}
              className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-40 bg-slate-100">
                <Image src={machine.image} alt={machine.name} fill className="object-cover" sizes="260px" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy">{machine.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Year {machine.year} | {machine.location}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/machines/${machine.slug}`}
                    className="rounded-md border border-navy px-2 py-2 text-center text-xs font-bold text-navy"
                  >
                    View Details
                  </Link>
                  <a
                    href={whatsappLink(`Hi TNCNC, I want details on ${machine.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-[#25d366] px-2 py-2 text-center text-xs font-bold text-white"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next machines"
          onClick={() => move(1)}
          className="absolute right-0 top-24 z-10 hidden h-10 w-10 translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg text-navy shadow sm:grid"
        >
          ›
        </button>
      </div>
    </section>
  );
}
