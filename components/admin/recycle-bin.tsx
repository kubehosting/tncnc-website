"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export type RecycledProduct = {
  id: string;
  name: string;
  sku: string | null;
  subcategory: string | null;
  childCategory: string | null;
  deletedAt: string;
  category: { name: string };
};

function deletedLabel(value: string) {
  return `${new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(value))} SGT`;
}

export function RecycleBin({ rows }: { rows: RecycledProduct[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function restore(row: RecycledProduct) {
    setPendingId(row.id);
    setError("");
    try {
      await adminFetch(`/api/admin/machines/${row.id}/restore`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore product");
    } finally {
      setPendingId("");
    }
  }

  async function removeForever(row: RecycledProduct) {
    if (!window.confirm(`Delete “${row.name}” forever? This cannot be restored.`)) {
      return;
    }
    setPendingId(row.id);
    setError("");
    try {
      await adminFetch(`/api/admin/machines/${row.id}?forever=1`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product");
    } finally {
      setPendingId("");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
        The recycle bin is empty.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {rows.map((row) => {
        const path = [row.category.name, row.subcategory, row.childCategory].filter(Boolean).join(" · ");
        const busy = pendingId === row.id;
        return (
          <article
            key={row.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-semibold text-navy">{row.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {row.sku ? `SKU ${row.sku} · ` : ""}
                {path}
              </p>
              <p className="mt-1 text-xs text-slate-500">Deleted {deletedLabel(row.deletedAt)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => restore(row)}
                className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                Restore
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeForever(row)}
                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60"
              >
                Delete forever
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
