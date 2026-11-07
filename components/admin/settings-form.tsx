"use client";

import { FormEvent, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import type { SiteSettings } from "@/lib/site-settings";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2";

export function SettingsForm({
  initial,
  keys,
}: {
  initial: SiteSettings;
  keys: { name: keyof SiteSettings; label: string; hint?: string; multiline?: boolean }[];
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(keys.map((item) => [item.name, initial[item.name]])) as Record<
      string,
      string
    >,
  );
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl bg-white p-5 shadow-sm">
      {keys.map((item) => (
        <label key={item.name} className="block text-sm font-medium text-slate-700">
          {item.label}
          {item.multiline ? (
            <textarea
              className={`${field} min-h-24`}
              value={values[item.name] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [item.name]: event.target.value }))
              }
            />
          ) : (
            <input
              className={field}
              value={values[item.name] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [item.name]: event.target.value }))
              }
            />
          )}
          {item.hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{item.hint}</span> : null}
        </label>
      ))}
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
