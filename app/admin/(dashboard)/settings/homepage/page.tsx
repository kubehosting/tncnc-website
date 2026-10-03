import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { HomepageSettingsForm } from "@/components/admin/homepage-settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Home Page Settings" };
export const dynamic = "force-dynamic";

export default async function HomepageSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader
        title="Home Page Settings"
        description="Manage at least three homepage slider images (they fade automatically), plus section titles and banners."
      />
      <HomepageSettingsForm initial={settings} />
    </>
  );
}
