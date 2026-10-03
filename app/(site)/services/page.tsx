import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { services } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Services",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Service & Support"
        subtitle="Installation, commissioning, repair, and AMC for CNC shops across India."
      />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 lg:px-6">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-lg bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-navy">{service.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{service.text}</p>
          </article>
        ))}
      </div>
    </>
  );
}
