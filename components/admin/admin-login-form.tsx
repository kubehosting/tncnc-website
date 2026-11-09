"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deskKey, setDeskKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not sign in");
      setPending(false);
      return;
    }
    const next = searchParams.get("next") || "/admin";
    router.replace(next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  async function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deskKey }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "Could not reset password");
      setPending(false);
      return;
    }
    setPassword("");
    setDeskKey("");
    setMode("login");
    setMessage("Password updated. Sign in with your email and the new password.");
    setPending(false);
  }

  if (mode === "reset") {
    return (
      <form method="post" onSubmit={onReset} className="space-y-4">
        <p className="text-sm text-slate-600">
          Enter the admin email, a new password, and the desk key from <code>.env</code> (
          <code>ADMIN_API_KEY</code>).
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Admin email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">New password</span>
          <input
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Desk key</span>
          <input
            type="password"
            required
            value={deskKey}
            onChange={(event) => setDeskKey(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2"
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
        >
          {pending ? "Updating…" : "Reset password"}
        </button>
        <button
          type="button"
          className="w-full text-sm font-semibold text-navy"
          onClick={() => {
            setMode("login");
            setError("");
            setDeskKey("");
          }}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form method="post" onSubmit={onLogin} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Leave blank to sign in with the desk API key from .env
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        className="w-full text-sm font-semibold text-navy"
        onClick={() => {
          setMode("reset");
          setError("");
          setMessage("");
          setPassword("");
        }}
      >
        Reset password
      </button>
    </form>
  );
}
