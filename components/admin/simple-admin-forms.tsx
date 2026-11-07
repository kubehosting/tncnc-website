"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDateTime } from "@/lib/admin-ui";

export function MessageList({
  initial,
}: {
  initial: {
    id: string;
    name: string;
    email: string;
    phone: string;
    body: string;
    source: string;
    read: boolean;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function markRead(id: string) {
    setError("");
    try {
      await adminFetch(`/api/admin/messages/${id}`, { method: "PATCH", body: "{}" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this message?")) {
      return;
    }
    try {
      await adminFetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      {error ? <p className="px-4 pt-4 text-sm text-rose-600">{error}</p> : null}
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">From</th>
            <th className="px-4 py-3">Message</th>
            <th className="px-4 py-3">Received</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {initial.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-slate-500">
                No enquiries yet.
              </td>
            </tr>
          ) : (
            initial.map((row) => (
              <tr key={row.id} className={row.read ? "" : "bg-sky-50"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.email}</p>
                  <p className="text-xs text-slate-500">{row.phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.body}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {row.read ? null : (
                    <button
                      type="button"
                      className="mr-3 font-semibold text-navy"
                      onClick={() => markRead(row.id)}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    className="font-semibold text-rose-700"
                    onClick={() => remove(row.id)}
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
  );
}

export function SimpleRecordForm({
  endpoint,
  fields,
  submitLabel,
}: {
  endpoint: string;
  fields: { name: string; label: string; type?: string; required?: boolean }[];
  submitLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const value = String(form.get(field.name) ?? "").trim();
      body[field.name] = field.type === "number" ? Number(value) : value;
    }
    setPending(true);
    setError("");
    try {
      await adminFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      {fields.map((field) => (
        <label key={field.name} className="block text-sm font-medium text-slate-700">
          {field.label}
          <input
            name={field.name}
            type={field.type ?? "text"}
            required={field.required}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      ))}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
