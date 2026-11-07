import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "SEO Tools" };
export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader title="SEO Tools" description="Default title and description for search listings." />
      <SettingsForm
        initial={settings}
        keys={[
          { name: "seoTitle", label: "SEO title" },
          { name: "seoDescription", label: "SEO description", multiline: true },
        ]}
      />
    </>
  );
}
