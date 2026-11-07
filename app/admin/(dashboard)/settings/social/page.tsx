import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Social Settings" };
export const dynamic = "force-dynamic";

export default async function SocialSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader title="Social Settings" description="Footer social links." />
      <SettingsForm
        initial={settings}
        keys={[
          { name: "instagram", label: "Instagram URL" },
          { name: "linkedin", label: "LinkedIn URL" },
          { name: "youtube", label: "YouTube URL" },
        ]}
      />
    </>
  );
}
