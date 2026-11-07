import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Sell Your Machine",
};

export default function SellPage() {
  return (
    <>
      <PageHero
        title="Sell Your Machine"
        subtitle="List your used CNC machine and get the best market value through our buyer network."
      />
      <div className="mx-auto max-w-xl px-4 py-10 lg:px-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <EnquiryForm
            heading="List a machine"
            submitLabel="Submit listing"
          />
        </div>
      </div>
    </>
  );
}
