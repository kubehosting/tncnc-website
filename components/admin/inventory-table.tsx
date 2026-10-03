"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/admin/admin-ui";
import { adminFetch } from "@/lib/admin-fetch";

type Row = {
  id: string;
  name: string;
  brand: string | null;
  stock: number;
  status: "AVAILABLE" | "SOLD";
  category: { name: string };
};

export function InventoryTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onDelete(row: Row) {
    if (!window.confirm(`Delete “${row.name}” from inventory?`)) {
      return;
    }
    setError("");
    try {
      await adminFetch(`/api/admin/machines/${row.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? <p className="px-4 pt-4 text-sm text-rose-600">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock Level</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={5}>
                  No machines or spare parts yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.brand ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.category.name}</td>
                  <td className="px-4 py-3 font-medium">{row.stock}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      value={row.status}
                      tone={row.status === "AVAILABLE" ? "green" : "slate"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/inventory/${row.id}`}
                      className="mr-3 text-sm font-semibold text-navy hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="text-sm font-semibold text-rose-700 hover:underline"
                      onClick={() => onDelete(row)}
                    >
                      Delete
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
