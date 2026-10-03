import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { fillCopyright, type NavItem } from "@/lib/site-nav";
import type { SiteSettings } from "@/lib/site-settings";

export function SiteFooter({
  settings,
  menu,
}: {
  settings: SiteSettings;
  menu: NavItem[];
}) {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-6">
        <div className="lg:col-span-1">
          <BrandLogo onDark src={settings.logoUrl} alt={settings.companyName} />
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/55">
            {settings.tagline}
          </p>
          <p className="mt-4 max-w-xs text-sm text-white/75">{settings.footerBlurb}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{settings.footerQuickLinksHeading}</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {menu.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{settings.footerLocationHeading}</h3>
          <p className="mt-4 text-sm text-white/75">{settings.address}</p>
          <p className="mt-2 text-sm text-white/75">{settings.phone}</p>
          <p className="mt-2 text-sm text-white/75">{settings.email}</p>
          <p className="mt-2 text-sm text-white/75">{settings.website}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{settings.footerFollowHeading}</h3>
          <div className="mt-4 flex gap-3">
            <Social href={settings.instagram} label="Instagram">
              <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5ZM17 7.2a.8.8 0 1 1-.8.8.8.8 0 0 1 .8-.8Z" />
            </Social>
            <Social href={settings.linkedin} label="LinkedIn">
              <path d="M6.5 9H4V20h2.5V9ZM5.2 4A1.5 1.5 0 1 0 5.3 7a1.5 1.5 0 0 0-.1-3ZM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6s-1.7.9-2 1.8V20H11V9h2.4v1.5A3.7 3.7 0 0 1 17 9c2.6 0 3 1.8 3 4.1V20Z" />
            </Social>
            <Social href={settings.youtube} label="YouTube">
              <path d="M23 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C18.8 5 12 5 12 5s-6.8 0-8.5.5A3 3 0 0 0 1.4 7.6C1 9 1 12.2 1 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C5.2 19.4 12 19.4 12 19.4s6.8 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6ZM9.8 15.5V8.9l6 3.3-6 3.3Z" />
            </Social>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{settings.footerSubscribeHeading}</h3>
          <p className="mt-4 text-sm text-white/75">{settings.footerSubscribeText}</p>
          <form className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded bg-white px-3 py-2 text-sm text-navy"
            />
            <button type="submit" className="rounded bg-gold px-3 py-2 text-sm font-bold text-navy">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>{fillCopyright(settings.footerCopyright)}</p>
          <p>{settings.footerBottomLine}</p>
        </div>
      </div>
    </footer>
  );
}

function Social({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-navy"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        {children}
      </svg>
    </a>
  );
}
