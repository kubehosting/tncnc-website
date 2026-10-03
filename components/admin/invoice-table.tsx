"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/admin/admin-ui";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate, inr } from "@/lib/admin-ui";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  totalAmount: string;
  status: "DRAFT" | "PENDING" | "PAID" | "OVERDUE";
  customer: { name: string };
  items: unknown[];
};

const tones = {
  DRAFT: "slate",
  PENDING: "amber",
  PAID: "green",
  OVERDUE: "red",
} as const;

async function downloadPdf(id: string, number: string) {
  const response = await fetch(`/api/admin/invoices/${id}/pdf`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Could not generate PDF");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function InvoiceTable({ rows }: { rows: InvoiceRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function finalize(id: string) {
    setBusy(id);
    setError("");
    try {
      await adminFetch(`/api/admin/invoices/${id}/finalize`, { method: "POST", body: "{}" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize");
    } finally {
      setBusy(null);
    }
  }

  async function pdf(row: InvoiceRow) {
    setBusy(row.id);
    setError("");
    try {
      await downloadPdf(row.id, row.invoiceNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? <p className="px-4 pt-4 text-sm text-rose-600">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={7}>
                  No invoices yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-navy">
                    <Link href={`/admin/invoices/${row.id}`} className="hover:underline">
                      {row.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.customer.name}</td>
                  <td className="px-4 py-3">{formatDate(row.issuedAt)}</td>
                  <td className="px-4 py-3">{row.items.length}</td>
                  <td className="px-4 py-3 font-medium">{inr(row.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={row.status} tone={tones[row.status]} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {row.status === "DRAFT" ? (
                      <button
                        type="button"
                        className="mr-3 text-sm font-semibold text-navy hover:underline"
                        disabled={busy === row.id}
                        onClick={() => finalize(row.id)}
                      >
                        Finalize
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-sm font-semibold text-navy hover:underline"
                      disabled={busy === row.id}
                      onClick={() => pdf(row)}
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
