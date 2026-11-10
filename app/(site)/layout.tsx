import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { getCustomerFromCookies } from "@/lib/customer-auth";
import { parseNav } from "@/lib/site-nav";
import { getCategoryMenu } from "@/lib/site-content";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, customer, categoryMenu] = await Promise.all([
    getSiteSettings(),
    getCustomerFromCookies(),
    getCategoryMenu(),
  ]);
  const headerMenu = parseNav(settings.headerMenuJson);
  const footerMenu = parseNav(settings.footerMenuJson, headerMenu);

  return (
    <>
      <SiteHeader
        logoUrl={settings.logoUrl}
        companyName={settings.companyName}
        menu={headerMenu}
        ctaLabel={settings.headerCtaLabel}
        ctaHref={settings.headerCtaHref}
        customerName={customer?.name ?? null}
        categoryMenu={categoryMenu}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} menu={footerMenu} />
      <WhatsAppFloat />
    </>
  );
}
