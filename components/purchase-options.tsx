"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OfferForm } from "@/components/offer-form";

const cartKey = "tncnc-cart";

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(cartKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function PurchaseOptions({
  slug,
  name,
  price,
  salesPeople,
}: {
  slug: string;
  name: string;
  price: number | null;
  salesPeople: string[];
}) {
  const [inCart, setInCart] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  useEffect(() => {
    setInCart(readCart().includes(slug));
  }, [slug]);

  function toggleCart() {
    const next = new Set(readCart());
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    localStorage.setItem(cartKey, JSON.stringify([...next]));
    setInCart(next.has(slug));
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase options</p>
      <h2 className="text-lg font-bold text-navy">Ready to purchase?</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add this item to your cart to begin checkout, or choose another option.
      </p>
      <div className="mt-4 grid gap-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        <button
          type="button"
          onClick={toggleCart}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left ${
            inCart ? "bg-red-700 text-white hover:bg-red-800" : "bg-[#f5b400] text-navy hover:bg-[#e0a800]"
          }`}
        >
          <CartIcon />
          <span>
            <span className="block text-sm font-bold">{inCart ? "Remove from Cart" : "Add to Cart"}</span>
            <span className={`block text-xs ${inCart ? "text-white/80" : "text-navy/70"}`}>
              {inCart ? "This item is currently in your cart" : "Save this item to buy"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOfferOpen(true)}
          className="flex items-center gap-3 rounded-lg bg-navy px-4 py-3 text-left text-white hover:bg-navy-deep"
        >
          <TagIcon />
          <span>
            <span className="block text-sm font-bold">Make an Offer</span>
            <span className="block text-xs text-white/70">Send us your best price</span>
          </span>
        </button>
        <Link
          href="/contact"
          className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-left hover:border-navy"
        >
          <PhoneIcon />
          <span>
            <span className="block text-sm font-bold text-navy">Contact Sales</span>
            <span className="block text-xs text-slate-500">Talk to the TNCNC desk</span>
          </span>
        </Link>
      </div>

      {offerOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Inventory #{slug}</p>
                <h3 id="offer-title" className="text-xl font-extrabold text-navy">
                  {name}
                </h3>
                <p className="text-sm text-slate-500">Send us your best price</p>
              </div>
              <button
                type="button"
                onClick={() => setOfferOpen(false)}
                className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="mt-5">
              <OfferForm slug={slug} name={name} price={price} salesPeople={salesPeople} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6.2 6l.4 2h13.2l-1.6 7H8.1L6 4H3V2h4l.2 1L6.2 6Z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
      <path d="M21 11.5 12.5 3H4v8.5L12.5 20 21 11.5ZM7.5 8A1.5 1.5 0 1 1 9 6.5 1.5 1.5 0 0 1 7.5 8Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-navy" aria-hidden>
      <path d="M6.6 3.5h3l1.5 4-2 1.2a12 12 0 0 0 6.2 6.2l1.2-2 4 1.5v3A2 2 0 0 1 18.5 19 15.5 15.5 0 0 1 5 5.5a2 2 0 0 1 1.6-2Z" />
    </svg>
  );
}
