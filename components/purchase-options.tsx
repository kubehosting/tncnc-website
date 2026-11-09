"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const firstName = String(data.firstName ?? "").trim();
    const lastName = String(data.lastName ?? "").trim();
    const email = String(data.email ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    const offer = String(data.offer ?? "").trim();
    const quantity = String(data.quantity ?? "").trim();
    const zip = String(data.zip ?? "").trim();
    const business = String(data.business ?? "").trim();
    const salesPerson = String(data.salesPerson ?? "").trim();
    const notes = String(data.notes ?? "").trim();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          source: "offer",
          message: [
            `Offer for ${name} (${slug})`,
            `Offer: ${offer}`,
            `Quantity: ${quantity}`,
            `Zip code: ${zip}`,
            `Business: ${business}`,
            `Sales person: ${salesPerson || "None selected"}`,
            notes ? `Notes: ${notes}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!response.ok) {
        throw new Error("Could not send the offer");
      }
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send the offer");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase options</p>
      <h2 className="text-lg font-bold text-navy">Ready to purchase?</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add this item to your cart to begin checkout, or choose another option.
      </p>
      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={toggleCart}
          className={`rounded-lg px-4 py-3 text-left ${
            inCart
              ? "bg-red-700 text-white hover:bg-red-800"
              : "bg-[#f5b400] text-navy hover:bg-[#e0a800]"
          }`}
        >
          <span className="block text-sm font-bold">{inCart ? "Remove from Cart" : "Add to Cart"}</span>
          <span className={`block text-xs ${inCart ? "text-white/80" : "text-navy/70"}`}>
            {inCart ? "This item is currently in your cart" : "Save this item to buy"}
          </span>
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setOfferOpen(true);
            }}
            className="rounded-lg bg-navy px-4 py-3 text-left text-white hover:bg-navy-deep"
          >
            <span className="block text-sm font-bold">Make an Offer</span>
            <span className="block text-xs text-white/70">Send us your best price</span>
          </button>
          <Link
            href="/contact"
            className="rounded-lg border border-slate-300 px-4 py-3 text-left hover:border-navy"
          >
            <span className="block text-sm font-bold text-navy">Contact Sales</span>
            <span className="block text-xs text-slate-500">Talk to the TNCNC desk</span>
          </Link>
        </div>
      </div>

      {offerOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Inventory #{slug}</p>
                <h3 id="offer-title" className="text-xl font-extrabold text-navy">
                  {name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOfferOpen(false)}
                className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {sent ? (
              <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Offer sent. The TNCNC sales desk will contact you.
              </p>
            ) : (
              <form onSubmit={submitOffer} className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="First name" name="firstName" required />
                <Field label="Last name" name="lastName" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" required />
                <Field
                  label="Your offer"
                  name="offer"
                  required
                  defaultValue={price != null ? String(price) : ""}
                />
                <Field label="Quantity" name="quantity" type="number" required defaultValue="1" />
                <Field label="Zip code" name="zip" required />
                <Field label="Business name" name="business" required />
                <label className="sm:col-span-2 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Sales person</span>
                  <select
                    name="salesPerson"
                    defaultValue=""
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  >
                    <option value="">None selected</option>
                    {salesPeople.map((person) => (
                      <option key={person} value={person}>
                        {person}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Offer notes</span>
                  <textarea
                    name="notes"
                    rows={4}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                {error ? <p className="sm:col-span-2 text-sm text-red-700">{error}</p> : null}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Submit Offer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={type === "number" ? 1 : undefined}
        className="w-full rounded border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
