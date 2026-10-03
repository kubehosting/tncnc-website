import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { HeaderFooterSettingsForm } from "@/components/admin/header-footer-settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Header & Footer" };
export const dynamic = "force-dynamic";

export default async function HeaderFooterSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader
        title="Header & Footer"
        description="Change the public logo, top menu, quote button, footer links, contact lines, and copyright text."
      />
      <HeaderFooterSettingsForm initial={settings} />
    </>
  );
}
