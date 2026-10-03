import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { company } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About TNCNC"
        subtitle={company.blurb}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            TNCNC sources, inspects, and supplies used CNC machines and spare
            parts for manufacturers who need production-ready equipment without
            long lead times. We work with shops across India and support import
            and export of verified machines.
          </p>
          <p className="mt-4 text-slate-600">
            From first enquiry to installation, our team helps you match the
            right lathe, VMC, or spare to the job — with WhatsApp support and
            on-ground service.
          </p>
        </div>
      </div>
    </>
  );
}
