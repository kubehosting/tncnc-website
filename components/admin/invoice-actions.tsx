"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";

export function InvoiceActions({
  id,
  number,
  status,
  customerEmail,
}: {
  id: string;
  number: string;
  status: string;
  customerEmail: string | null;
}) {
  const router = useRouter();
  const [to, setTo] = useState(customerEmail ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function download() {
    setBusy("pdf");
    setMessage("");
    const response = await fetch(`/api/admin/invoices/${id}/pdf`, { credentials: "include" });
    if (!response.ok) {
      setMessage("Could not generate PDF");
      setBusy(null);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setBusy(null);
  }

  async function email() {
    setBusy("email");
    setMessage("");
    try {
      await adminFetch(`/api/admin/invoices/${id}/email`, {
        method: "POST",
        body: JSON.stringify({ to }),
      });
      setMessage(`Invoice emailed to ${to}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Email failed");
    } finally {
      setBusy(null);
    }
  }

  async function finalize() {
    setBusy("final");
    setMessage("");
    try {
      await adminFetch(`/api/admin/invoices/${id}/finalize`, { method: "POST", body: "{}" });
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not finalize");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-navy">PDF & email</h2>
      <p className="text-sm text-slate-600">
        PDFs are generated with <span className="font-medium">pdf-lib</span>. Email uses Nodemailer when SMTP is set in
        .env.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={busy !== null}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
        >
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
        {status === "DRAFT" ? (
          <button
            type="button"
            onClick={finalize}
            disabled={busy !== null}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {busy === "final" ? "Finalizing…" : "Finalize & deduct stock"}
          </button>
        ) : null}
      </div>
      <label className="block text-sm font-medium">
        Send to
        <input
          type="email"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={email}
        disabled={busy !== null || !to}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {busy === "email" ? "Sending…" : "Email PDF to customer"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
