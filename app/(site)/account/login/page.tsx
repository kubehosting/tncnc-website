import type { Metadata } from "next";
import { CustomerAuthForm } from "@/components/customer-auth-form";

export const metadata: Metadata = { title: "Customer sign in" };
export const dynamic = "force-dynamic";

export default function CustomerLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold text-navy">Customer sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        View your quotes and invoices after you create an account.
      </p>
      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
        <CustomerAuthForm mode="login" />
      </div>
    </div>
  );
}
