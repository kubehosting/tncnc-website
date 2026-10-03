import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Get a Quote",
};

export default function QuotePage() {
  return (
    <>
      <PageHero
        title="Get a Quote"
        subtitle="Tell us the machine or spare you need. We source locally and globally."
      />
      <div className="mx-auto max-w-xl px-4 py-10 lg:px-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <EnquiryForm heading="Quote request" submitLabel="Request quote" />
        </div>
      </div>
    </>
  );
}
