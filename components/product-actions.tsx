"use client";

import Link from "next/link";

export function ProductActions({
  name,
  quoteHref,
  whatsappHref,
  phone,
  phoneHref,
}: {
  name: string;
  quoteHref: string;
  whatsappHref: string;
  phone: string;
  phoneHref: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Link
        href={quoteHref}
        className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy hover:bg-gold-hover"
      >
        Get Quote
        <span aria-hidden>→</span>
      </Link>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-[#25d366] px-4 py-3 text-sm font-bold text-[#128C7E] hover:bg-emerald-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.8.7.7-3.7-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.3a.5.5 0 0 0 0-.5l-.6-1.5c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c-.1-.2-.3-.2-.6-.3Z" />
        </svg>
        WhatsApp Us
      </a>
      <button
        type="button"
        onClick={() => {
          document.getElementById("machine-enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dispatchEvent(new CustomEvent("tncnc-open-enquiry"));
        }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white hover:bg-navy-deep"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 8H5v10h14V10ZM7 6H6v2h1V6Zm11 0h-1v2h1V6Z" />
        </svg>
        Request Inspection
      </button>
      <div className="mt-3 flex items-start gap-3 border-t border-slate-100 px-1 pt-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-navy">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M6.6 3.5h3l1.5 4-2 1.2a12 12 0 0 0 6.2 6.2l1.2-2 4 1.5v3A2 2 0 0 1 18.5 19 15.5 15.5 0 0 1 5 5.5a2 2 0 0 1 1.6-2Z" />
          </svg>
        </span>
        <div>
          <p className="text-xs text-slate-500">Need Help?</p>
          <a href={phoneHref} className="font-bold text-navy">
            {phone}
          </a>
          <p className="text-xs text-slate-400">Mon – Sat, 9 AM – 6 PM</p>
          <p className="sr-only">Ask about {name}</p>
        </div>
      </div>
    </div>
  );
}
