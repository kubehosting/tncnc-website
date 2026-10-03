"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { adminFetch } from "@/lib/admin-fetch";

export default function ClearCachePage() {
  const [message, setMessage] = useState("");

  return (
    <>
      <AdminPageHeader
        title="Clear Cache"
        description="Refresh cached public pages after inventory or homepage changes."
      />
      <button
        type="button"
        className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy"
        onClick={async () => {
          setMessage("");
          await adminFetch("/api/admin/cache", { method: "POST", body: "{}" });
          setMessage("Cache cleared.");
        }}
      >
        Clear cache now
      </button>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </>
  );
}
