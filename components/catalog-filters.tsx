import Link from "next/link";
import type { CatalogFacet } from "@/lib/site-content";

function filterHref(
  basePath: string,
  type: string,
  next: { sub?: string; child?: string; sku?: string },
) {
  const params = new URLSearchParams();
  params.set("type", type);
  if (next.sub) {
    params.set("sub", next.sub);
  }
  if (next.child) {
    params.set("child", next.child);
  }
  if (next.sku) {
    params.set("sku", next.sku);
  }
  return `${basePath}?${params.toString()}`;
}

export function CatalogFilters({
  basePath,
  type,
  subcategories,
  children,
  subcategory,
  childCategory,
  sku,
}: {
  basePath: string;
  type: string;
  subcategories: CatalogFacet[];
  children: CatalogFacet[];
  subcategory?: string;
  childCategory?: string;
  sku?: string;
}) {
  const selectedSub = subcategory?.trim() ?? "";
  const selectedChild = childCategory?.trim() ?? "";
  const selectedSku = sku?.trim() ?? "";
  const hasFilters = Boolean(selectedSub || selectedChild || selectedSku);

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Filter</h2>
        {hasFilters ? (
          <Link href={`${basePath}?type=${encodeURIComponent(type)}`} className="text-xs font-semibold text-rose-700">
            Clear
          </Link>
        ) : null}
      </div>

      <form method="get" className="mt-4">
        <input type="hidden" name="type" value={type} />
        {selectedSub ? <input type="hidden" name="sub" value={selectedSub} /> : null}
        {selectedChild ? <input type="hidden" name="child" value={selectedChild} /> : null}
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          SKU
          <input
            name="sku"
            defaultValue={selectedSku}
            placeholder="Search SKU"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="mt-2 w-full rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white">
          Find SKU
        </button>
      </form>

      <FilterGroup
        title="Subcategory"
        options={subcategories}
        selected={selectedSub}
        hrefFor={(label) =>
          filterHref(basePath, type, {
            sub: label.toLowerCase() === selectedSub.toLowerCase() ? undefined : label,
            sku: selectedSku,
          })
        }
        clearHref={filterHref(basePath, type, { sku: selectedSku })}
      />
      <FilterGroup
        title="Child category"
        options={children}
        selected={selectedChild}
        hrefFor={(label) =>
          filterHref(basePath, type, {
            sub: selectedSub,
            child: label.toLowerCase() === selectedChild.toLowerCase() ? undefined : label,
            sku: selectedSku,
          })
        }
        clearHref={filterHref(basePath, type, { sub: selectedSub, sku: selectedSku })}
      />
    </aside>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  hrefFor,
  clearHref,
}: {
  title: string;
  options: CatalogFacet[];
  selected: string;
  hrefFor: (label: string) => string;
  clearHref: string;
}) {
  if (options.length === 0) {
    return null;
  }
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1">
        <li>
          <Link
            href={clearHref}
            className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
              selected ? "text-slate-600 hover:bg-slate-50" : "bg-amber-50 font-semibold text-navy"
            }`}
          >
            <span>All</span>
          </Link>
        </li>
        {options.map((option) => {
          const active = option.label.toLowerCase() === selected.toLowerCase();
          return (
            <li key={option.label}>
              <Link
                href={hrefFor(option.label)}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm ${
                  active ? "bg-amber-50 font-semibold text-navy" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{option.label}</span>
                <span className="text-xs text-slate-500">{option.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
