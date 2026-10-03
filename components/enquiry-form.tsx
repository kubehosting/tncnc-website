"use client";

import { useState } from "react";

export function EnquiryForm({
  heading,
  submitLabel = "Submit enquiry",
}: {
  heading: string;
  submitLabel?: string;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (sent) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Thank you. Our team will contact you shortly.
      </p>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        setPending(true);
        setError("");
        try {
          const response = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error("Could not send enquiry");
          }
          setSent(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not send enquiry");
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 className="text-xl font-bold text-navy">{heading}</h2>
      <input
        required
        name="name"
        placeholder="Your name"
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <input
        required
        name="phone"
        placeholder="Phone / WhatsApp"
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <textarea
        required
        name="message"
        rows={4}
        placeholder="Machine, spare part, or service you need"
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
