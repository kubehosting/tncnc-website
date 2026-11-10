"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { adminNav } from "@/lib/admin-nav";

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  if (href === "/admin/categories") {
    return pathname === href;
  }
  if (href === "/admin/inventory") {
    return pathname === href || /^\/admin\/inventory\/(?!bulk|recycle)/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupOpen(pathname: string, hrefs: readonly string[]) {
  return hrefs.some((href) => isActive(pathname, href));
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Product: true,
    Settings: true,
  });

  const currentLabel = useMemo(() => {
    for (const item of adminNav) {
      if ("href" in item && item.href && isActive(pathname, item.href)) {
        return item.label;
      }
      if ("children" in item && item.children) {
        const child = item.children.find((entry) => isActive(pathname, entry.href));
        if (child) {
          return child.label;
        }
      }
    }
    return "Dashboard";
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-4 text-[13px]">
      {adminNav.map((item) => {
        if ("children" in item && item.children) {
          const hrefs = item.children.map((child) => child.href);
          const openGroup = expanded[item.label] ?? groupOpen(pathname, hrefs);
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() =>
                  setExpanded((current) => ({
                    ...current,
                    [item.label]: !openGroup,
                  }))
                }
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-slate-600 hover:bg-slate-100"
              >
                {item.label}
                <span className="text-[10px] text-slate-400">{openGroup ? "▾" : "▸"}</span>
              </button>
              {openGroup
                ? item.children.map((child) => {
                    const active = isActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={`ml-3 block rounded-md px-3 py-1.5 ${
                          active
                            ? "bg-sky-500 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })
                : null}
            </div>
          );
        }

        if (!("href" in item)) {
          return null;
        }

        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2 font-medium ${
              active ? "bg-sky-500 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#eef3f9]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-100 px-4 py-4">
          <Link href="/admin" aria-label="TNCNC admin home" className="block">
            <BrandLogo />
          </Link>
          <p className="mt-2 text-[11px] text-slate-500">Internal operations</p>
        </div>
        <div className="flex-1 overflow-y-auto pt-3">{nav}</div>
        <div className="border-t border-slate-100 p-3">
          <p className="mb-2 px-2 text-[11px] text-slate-400">TNCNC desk</p>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <span className="flex w-4 flex-col gap-1">
              <span className="h-0.5 w-full bg-navy" />
              <span className="h-0.5 w-full bg-navy" />
              <span className="h-0.5 w-full bg-navy" />
            </span>
          </button>
          <p className="text-sm font-semibold text-navy">{currentLabel}</p>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
