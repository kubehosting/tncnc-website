"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded border border-navy px-3 py-1.5 text-sm font-semibold text-navy disabled:opacity-60"
      onClick={async () => {
        setPending(true);
        await fetch("/api/account/logout", { method: "POST" });
        router.replace("/");
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
