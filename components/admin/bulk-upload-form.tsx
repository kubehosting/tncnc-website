"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export function BulkUploadForm({ categories }: { categories: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const [updated, setUpdated] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function onFile(file: File) {
    setPending(true);
    setCreated(null);
    setUpdated(null);
    setErrors([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const payload = (await adminFetch("/api/admin/machines/bulk", {
        method: "POST",
        body,
      })) as { created?: number; updated?: number; errors?: string[] };
      setCreated(payload.created ?? 0);
      setUpdated(payload.updated ?? 0);
      setErrors(payload.errors ?? []);
      router.refresh();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Import failed"]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Upload a CSV or Excel (.xls) file. Matching slugs are updated; new slugs are created.
          You can export inventory first, edit the sheet, then import it back.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/api/admin/machines/import-template"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-navy hover:border-gold"
          >
            Download CSV template
          </a>
          <a
            href="/api/admin/machines/export"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-navy hover:border-gold"
          >
            Download current inventory
          </a>
        </div>
        <label className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-gold">
          <span className="font-semibold text-navy">
            {pending ? "Importing…" : "Choose CSV or Excel file"}
          </span>
          <span className="mt-1 text-xs text-slate-500">.csv or .xls · same columns as the export sheet</span>
          <input
            type="file"
            accept=".csv,.xls,.xml,text/csv,application/vnd.ms-excel"
            className="hidden"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void onFile(file);
              }
            }}
          />
        </label>
        {created !== null ? (
          <p className="mt-4 text-sm font-medium text-navy">
            Imported {created} new item(s), updated {updated} existing item(s).
          </p>
        ) : null}
        {errors.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
        <p className="font-semibold text-navy">Required columns</p>
        <p className="mt-1 text-slate-600">
          <code>name</code> and <code>categorySlug</code> (or Category name from an Excel export).
        </p>
        <p className="mt-4 font-semibold text-navy">Category slugs</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.slug}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            >
              {category.name} → {category.slug}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
