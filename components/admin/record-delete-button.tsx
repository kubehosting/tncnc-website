"use client";

import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";

export function RecordDeleteButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-sm font-semibold text-rose-700"
      onClick={async () => {
        if (!window.confirm("Delete this record?")) {
          return;
        }
        await adminFetch(href, { method: "DELETE" });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
