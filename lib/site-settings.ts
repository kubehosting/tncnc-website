import { defaultHeroSlides, stringifyHeroSlides } from "@/lib/hero-slides";
import { prisma } from "@/lib/prisma";
import { defaultHeaderMenu, stringifyNav } from "@/lib/site-nav";

export const settingDefaults = {
  companyName: "TNCNC",
  tagline: "Machinery | Spares | Solutions",
  phone: "+91 99627 30000",
  email: "info@tncnc.in",
  address: "Chennai, Tamil Nadu, India",
  website: "www.tncnc.in",
  logoUrl: "/tncnc-logo.png",
  headerCtaLabel: "Get a Quote",
  headerCtaHref: "/quote",
  headerMenuJson: stringifyNav(defaultHeaderMenu),
  footerMenuJson: stringifyNav(defaultHeaderMenu),
  footerBlurb: "India's Trusted Source for CNC Machinery & Spare Parts",
  footerQuickLinksHeading: "Quick Links",
  footerLocationHeading: "Our Location",
  footerFollowHeading: "Follow Us",
  footerSubscribeHeading: "Subscribe for Updates",
  footerSubscribeText: "Get new arrivals and offers.",
  footerCopyright: "© {year} TNCNC. All Rights Reserved.",
  footerBottomLine: "Buy | Sell | Service | Support | Built for the Machine Industry",
  heroTitle: "Quality CNC Machines for a Stronger Tomorrow",
  heroSubtitle: "Used CNC Machines | New Arrivals | Spare Parts | Global Sourcing",
  heroImageUrl:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1800&q=80",
  heroSlidesJson: stringifyHeroSlides(defaultHeroSlides),
  heroSliderSeconds: "6",
  heroBadge1: "Trusted by 1000+ Customers",
  heroBadge2: "Pan India & Export Support",
  heroBadge3: "Wide Range of Machines & Spares",
  featuredBrand: "DMG MORI",
  featuredCaption: "CNC Vertical Machining Center",
  featuredTagline: "High Precision. Higher Possibilities.",
  featuredHeading: "Featured Used CNC Machines",
  featuredSubheading: "High Performance Machines. Verified & Ready for Production.",
  spareHeading: "CNC Spare Parts",
  spareSubheading: "Genuine | Compatible | Tested | Ready Stock",
  importHeading: "Import\nExport\nGlobal Supply",
  importText: "We source machines worldwide for your needs.",
  sellTitle: "Sell Your Machine",
  sellText: "Get the best value for your used CNC machines.",
  sourceTitle: "Need a Specific Machine or Part?",
  sourceText: "We will source it for you globally.",
  serviceTitle: "Service & Support",
  serviceText: "Installation | Commissioning | Repair | AMC",
  brandsLine: "FANUC, SIEMENS, MITSUBISHI, Mazak, DMG MORI, OKUMA, DOOSAN, HAAS, MAKINO, brother, Sodick",
  smtpHost: "",
  smtpUser: "",
  paymentNote: "Bank transfer and GST invoices. Default tax 18%.",
  gstRate: "18",
  instagram: "https://www.instagram.com/",
  linkedin: "https://www.linkedin.com/",
  youtube: "https://www.youtube.com/",
  seoTitle: "TNCNC | CNC Machines, Used CNC & Spare Parts",
  seoDescription:
    "Buy and sell used CNC machines and spare parts with pan-India support.",
};

export type SiteSettings = typeof settingDefaults;

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return { ...settingDefaults, ...map };
  } catch (error) {
    console.error("Could not load site settings from the database.", error);
    return { ...settingDefaults };
  }
}

export async function saveSiteSettings(patch: Record<string, string>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in settingDefaults)) {
      continue;
    }
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  return getSiteSettings();
}
