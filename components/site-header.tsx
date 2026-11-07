"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import type { NavItem } from "@/lib/site-nav";

export function SiteHeader({
  logoUrl,
  companyName,
  menu,
  ctaLabel,
  ctaHref,
  customerName,
}: {
  logoUrl: string;
  companyName: string;
  menu: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  customerName?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" aria-label={`${companyName} home`} className="flex shrink-0 items-center">
          <BrandLogo onDark priority src={logoUrl} alt={companyName} />
        </Link>

        <nav className="hidden items-center gap-0.5 text-[13px] font-medium lg:flex">
          {menu.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`rounded-sm px-2.5 py-2 transition ${
                  active ? "bg-gold text-navy" : "text-white/90 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {customerName ? (
            <Link
              href="/account"
              className="hidden rounded px-2 py-2 text-sm font-medium text-white/90 hover:bg-white/10 sm:inline"
            >
              Hi, {customerName.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/account/login"
              className="hidden rounded px-2 py-2 text-sm font-medium text-white/90 hover:bg-white/10 sm:inline"
            >
              Sign in
            </Link>
          )}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="rounded bg-gold px-3 py-2 text-sm font-bold text-navy hover:bg-gold-hover"
            >
              {ctaLabel}
            </Link>
          ) : null}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded border border-white/20 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-4 flex-col gap-1">
              <span className="h-0.5 w-full bg-white" />
              <span className="h-0.5 w-full bg-white" />
              <span className="h-0.5 w-full bg-white" />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-navy-deep px-4 py-3 lg:hidden">
          {menu.map((link) => (
            <Link
              key={`mobile-${link.href}-${link.label}`}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded px-2 py-2 text-sm text-white hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          {customerName ? (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block rounded px-2 py-2 text-sm text-white hover:bg-white/10"
            >
              My account
            </Link>
          ) : (
            <>
              <Link
                href="/account/login"
                onClick={() => setOpen(false)}
                className="block rounded px-2 py-2 text-sm text-white hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/account/signup"
                onClick={() => setOpen(false)}
                className="block rounded px-2 py-2 text-sm text-white hover:bg-white/10"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      ) : null}
    </header>
  );
}
