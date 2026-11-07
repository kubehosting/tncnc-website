"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function CustomerAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const path = mode === "signup" ? "/api/account/signup" : "/api/account/login";
    const body =
      mode === "signup" ? { name, email, phone, password } : { email, password };
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not continue");
      setPending(false);
      return;
    }
    const next = searchParams.get("next") || "/account";
    router.replace(next.startsWith("/account") ? next : "/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? (
        <label className="block text-sm font-medium text-navy">
          Full name
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
      ) : null}
      <label className="block text-sm font-medium text-navy">
        Email
        <input
          type="email"
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      {mode === "signup" ? (
        <label className="block text-sm font-medium text-navy">
          Phone
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
      ) : null}
      <label className="block text-sm font-medium text-navy">
        Password
        <input
          type="password"
          minLength={8}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {mode === "signup" ? (
        <p className="text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/account/login" className="font-semibold text-navy underline">
            Sign in
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-slate-600">
          New customer?{" "}
          <Link href="/account/signup" className="font-semibold text-navy underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}
