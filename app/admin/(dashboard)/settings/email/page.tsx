import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Email Settings" };
export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader
        title="Email Settings"
        description="SMTP values used when emailing invoice PDFs. You can also keep them in .env."
      />
      <SettingsForm
        initial={settings}
        keys={[
          { name: "smtpHost", label: "SMTP host", hint: "Leave blank to use SMTP_HOST from .env" },
          { name: "smtpUser", label: "SMTP user" },
        ]}
      />
    </>
  );
}
