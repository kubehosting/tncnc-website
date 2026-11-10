"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CategoryMenuGroup } from "@/lib/site-content";

function splitByKind(groups: CategoryMenuGroup[]) {
  return [
    { label: "Machines", groups: groups.filter((group) => group.kind !== "SPARE") },
    { label: "Spare parts", groups: groups.filter((group) => group.kind === "SPARE") },
  ].filter((section) => section.groups.length > 0);
}

function Count({ value }: { value: number }) {
  return <span className="ml-1 font-normal text-slate-400">({value.toLocaleString("en-IN")})</span>;
}

function GroupColumn({ group, onNavigate }: { group: CategoryMenuGroup; onNavigate: () => void }) {
  return (
    <div className="min-w-0">
      <Link
        href={group.href}
        onClick={onNavigate}
        className="flex items-baseline text-sm font-bold text-navy hover:text-gold-hover"
        title={group.name}
      >
        <span className="truncate">{group.name}</span>
        <Count value={group.count} />
      </Link>
      {group.subcategories.length ? (
        <ul className="mt-1.5 space-y-1">
          {group.subcategories.map((sub) => (
            <li key={sub.href}>
              <Link
                href={sub.href}
                onClick={onNavigate}
                className="flex items-baseline rounded px-1 -mx-1 text-[13px] text-slate-600 hover:bg-slate-100 hover:text-navy"
                title={sub.name}
              >
                <span className="truncate">{sub.name}</span>
                <Count value={sub.count} />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={group.href}
              onClick={onNavigate}
              className="text-[12px] font-semibold text-navy/70 hover:text-navy hover:underline"
            >
              View all →
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export function CategoryMegaMenu({ groups }: { groups: CategoryMenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!groups.length) {
    return null;
  }

  return (
    <div ref={rootRef} className="hidden shrink-0 lg:block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        title="Browse categories"
        onClick={() => setOpen((value) => !value)}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2.5 py-1.5 text-[13px] font-semibold transition ${
          open
            ? "border-gold bg-gold text-navy"
            : "border-white/25 text-white hover:border-white/50 hover:bg-white/10"
        }`}
      >
        <span className="flex w-3.5 flex-col gap-[3px]" aria-hidden>
          <span className="h-0.5 w-full bg-current" />
          <span className="h-0.5 w-full bg-current" />
          <span className="h-0.5 w-full bg-current" />
        </span>
        <span className="sr-only xl:not-sr-only">Categories</span>
        <span aria-hidden className={`hidden text-[10px] transition xl:inline ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open ? (
        <div className="absolute inset-x-4 top-full z-50 mt-1 max-h-[75vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-left shadow-2xl lg:inset-x-6">
          {splitByKind(groups).map((section) => (
            <section key={section.label} className="mb-6 last:mb-0">
              <h3 className="mb-3 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.label}
              </h3>
              <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                {section.groups.map((group) => (
                  <GroupColumn key={group.slug} group={group} onNavigate={() => setOpen(false)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MobileCategoryList({
  groups,
  onNavigate,
}: {
  groups: CategoryMenuGroup[];
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!groups.length) {
    return null;
  }
  return (
    <details className="group mb-2 rounded border border-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-2 text-sm font-semibold text-white">
        Categories
        <span aria-hidden className="text-[10px] transition group-open:rotate-180">▼</span>
      </summary>
      <div className="space-y-3 border-t border-white/10 px-2 py-3">
        {splitByKind(groups).map((section) => (
          <div key={section.label}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
              {section.label}
            </p>
            <ul>
              {section.groups.map((group) => (
                <li key={group.slug}>
                  <div className="flex items-center">
                    <Link
                      href={group.href}
                      onClick={onNavigate}
                      className="flex-1 rounded px-2 py-1.5 text-sm text-white hover:bg-white/10"
                    >
                      {group.name}
                      <span className="ml-1 text-white/50">({group.count})</span>
                    </Link>
                    {group.subcategories.length ? (
                      <button
                        type="button"
                        aria-label={`Show ${group.name} subcategories`}
                        aria-expanded={expanded === group.slug}
                        onClick={() => setExpanded((value) => (value === group.slug ? null : group.slug))}
                        className="grid h-8 w-8 place-items-center rounded text-white/70 hover:bg-white/10"
                      >
                        {expanded === group.slug ? "−" : "+"}
                      </button>
                    ) : null}
                  </div>
                  {expanded === group.slug ? (
                    <ul className="mb-1 ml-3 border-l border-white/10 pl-2">
                      {group.subcategories.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={onNavigate}
                            className="block rounded px-2 py-1 text-[13px] text-white/80 hover:bg-white/10"
                          >
                            {sub.name}
                            <span className="ml-1 text-white/40">({sub.count})</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
