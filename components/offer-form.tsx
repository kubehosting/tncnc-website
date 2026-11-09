"use client";

import { FormEvent, useState } from "react";

export function OfferForm({
  slug,
  name,
  price,
  salesPeople,
  source = "offer",
  submitLabel = "Submit Offer",
}: {
  slug: string;
  name: string;
  price: number | null;
  salesPeople: string[];
  source?: string;
  submitLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
          source,
          message: [
            `${source === "inspection" ? "Inspection request" : "Offer"} for ${name} (${slug})`,
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

  if (sent) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Received. The TNCNC sales desk will contact you about {name}.
      </p>
    );
  }

  return (
    <form onSubmit={submitOffer} className="grid gap-4 sm:grid-cols-2">
      <Field label="First Name" name="firstName" required />
      <Field label="Last Name" name="lastName" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" required />
      <Field label="Your Offer" name="offer" required defaultValue={price != null ? String(price) : ""} />
      <Field label="Quantity" name="quantity" type="number" required defaultValue="1" />
      <Field label="Zip Code" name="zip" required />
      <Field label="Business Name" name="business" required />
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-slate-700">Sales Rep</span>
        <select name="salesPerson" defaultValue="" className="w-full rounded border border-slate-300 px-3 py-2">
          <option value="">None Selected</option>
          {salesPeople.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">Select a sales person</span>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-slate-700">Offer Notes</span>
        <textarea name="notes" rows={4} className="w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
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
