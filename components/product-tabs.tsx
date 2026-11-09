"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { OfferForm } from "@/components/offer-form";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "gallery", label: "Gallery" },
  { id: "video", label: "Video" },
  { id: "enquiry", label: "Enquiry" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductTabs({
  name,
  slug,
  overview,
  highlights,
  specs,
  images,
  videoUrl,
  price,
  salesPeople,
}: {
  name: string;
  slug: string;
  overview: string;
  highlights: { title: string; text: string }[];
  specs: { label: string; value: string }[];
  images: string[];
  videoUrl: string | null;
  price: number | null;
  salesPeople: string[];
}) {
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    function openEnquiry() {
      setTab("enquiry");
    }
    window.addEventListener("tncnc-open-enquiry", openEnquiry);
    return () => window.removeEventListener("tncnc-open-enquiry", openEnquiry);
  }, []);

  return (
    <section id="machine-enquiry" className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${
              tab === item.id ? "border-gold text-navy" : "border-transparent text-slate-500 hover:text-navy"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-8 p-5 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
          <div>
            <h2 className="text-xl font-extrabold text-navy">Product Overview</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{overview}</p>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {highlights.map((item) => (
                <div key={item.title} className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-navy">
                    <HighlightIcon title={item.title} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-navy">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <SpecCard specs={specs} />
        </div>
      ) : null}

      {tab === "specifications" ? (
        <div className="p-5 lg:p-8">
          <h2 className="text-xl font-extrabold text-navy">Specifications</h2>
          <div className="mt-4">
            <SpecCard specs={specs} />
          </div>
        </div>
      ) : null}

      {tab === "gallery" ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 lg:p-8">
          {images.length ? (
            images.map((image, index) => (
              <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <Image src={image} alt={`${name} photo ${index + 1}`} fill className="object-cover" sizes="33vw" />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Photos will be added after inspection.</p>
          )}
        </div>
      ) : null}

      {tab === "video" ? (
        <div className="p-5 lg:p-8">
          {videoUrl ? (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe title={`${name} video`} src={videoUrl} className="h-full w-full" allowFullScreen />
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-8 text-center">
              <h2 className="text-lg font-bold text-navy">Inspection video on request</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Ask the sales desk for a walkaround of {name}. Use the Enquiry tab to leave your number.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {tab === "enquiry" ? (
        <div className="p-5 lg:p-8">
          <p className="text-xs text-slate-500">Inventory #{slug}</p>
          <h2 className="text-xl font-extrabold text-navy">{name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Send an offer or ask for an inspection. The same details reach the sales desk.
          </p>
          <div className="mt-5">
            <OfferForm
              slug={slug}
              name={name}
              price={price}
              salesPeople={salesPeople}
              source="inspection"
              submitLabel="Submit Offer"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SpecCard({ specs }: { specs: { label: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <h3 className="border-b border-slate-200 px-4 py-3 text-base font-bold text-navy">Key Specifications</h3>
      <dl>
        {specs.map((row) => (
          <div key={row.label} className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="text-right font-semibold text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HighlightIcon({ title }: { title: string }) {
  const path =
    title === "High Precision"
      ? "M12 2a10 10 0 1 0 .2 20.01A10 10 0 0 0 12 2Zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 3a4 4 0 1 0 .01 0H12Zm0 2.25a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z"
      : title === "High Productivity"
        ? "M4 19h3V9H4v10Zm6.5 0h3V4h-3v15ZM17 19h3v-8h-3v8Z"
        : title === "Reliable Operation"
          ? "M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Zm-1 13-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z"
          : "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z";
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
      <path d={path} />
    </svg>
  );
}
