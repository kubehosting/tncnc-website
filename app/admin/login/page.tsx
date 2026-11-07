import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-navy-deep px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <BrandLogo />
          <p className="mt-3 text-sm text-slate-500">Sign in to manage inventory and invoices</p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading sign-in…</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
