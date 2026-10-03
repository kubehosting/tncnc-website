import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "General Settings" };
export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader title="General Settings" description="Company identity shown across the public site and invoices." />
      <SettingsForm
        initial={settings}
        keys={[
          { name: "companyName", label: "Company name" },
          { name: "tagline", label: "Tagline" },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email" },
          { name: "address", label: "Address" },
          { name: "website", label: "Website" },
        ]}
      />
    </>
  );
}
