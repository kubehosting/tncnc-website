import type { Metadata } from "next";
import { CustomerAuthForm } from "@/components/customer-auth-form";

export const metadata: Metadata = { title: "Create customer account" };
export const dynamic = "force-dynamic";

export default function CustomerSignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold text-navy">Create an account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign up to track enquiries, quotes, and invoices. If we already have your email on file,
        this password will attach to that customer record.
      </p>
      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
        <CustomerAuthForm mode="signup" />
      </div>
    </div>
  );
}
