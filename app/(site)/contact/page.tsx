import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero } from "@/components/page-hero";
import { company } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Talk to our team for buying, selling, spares, or service."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2 lg:px-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="font-semibold text-navy">{company.address}</p>
          <p className="mt-2 text-sm text-slate-600">{company.phone}</p>
          <p className="mt-1 text-sm text-slate-600">{company.email}</p>
          <p className="mt-1 text-sm text-slate-600">{company.website}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <EnquiryForm heading="Send a message" />
        </div>
      </div>
    </>
  );
}
