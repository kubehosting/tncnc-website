import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Payment Settings" };
export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader title="Payment Settings" description="GST and payment notes for invoices." />
      <SettingsForm
        initial={settings}
        keys={[
          { name: "gstRate", label: "Default GST %" },
          { name: "paymentNote", label: "Payment note", multiline: true },
        ]}
      />
    </>
  );
}
