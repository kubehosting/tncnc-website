import Link from "next/link";
import type { CatalogFacet } from "@/lib/site-content";

function filterHref(
  basePath: string,
  next: { type?: string; sub?: string; child?: string; sku?: string },
) {
  const params = new URLSearchParams();
  if (next.type) {
    params.set("type", next.type);
  }
  if (next.sub) {
    params.set("sub", next.sub);
  }
  if (next.child) {
    params.set("child", next.child);
  }
  if (next.sku) {
    params.set("sku", next.sku);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function CatalogFilters({
  basePath,
  categories,
  type,
  subcategories,
  children,
  subcategory,
  childCategory,
  sku,
}: {
  basePath: string;
  categories?: CatalogFacet[];
  type?: string;
  subcategories: CatalogFacet[];
  children: CatalogFacet[];
  subcategory?: string;
  childCategory?: string;
  sku?: string;
}) {
  const selectedType = type?.trim() ?? "";
  const selectedSub = subcategory?.trim() ?? "";
  const selectedChild = childCategory?.trim() ?? "";
  const selectedSku = sku?.trim() ?? "";
  const lockedType = !categories?.length && Boolean(selectedType);
  const hasFilters = Boolean(
    selectedSub || selectedChild || selectedSku || (!lockedType && selectedType),
  );
  const keptType = lockedType ? selectedType : undefined;

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Filter</h2>
        {hasFilters ? (
          <Link href={filterHref(basePath, { type: keptType })} className="text-xs font-semibold text-rose-700">
            Clear
          </Link>
        ) : null}
      </div>

      <form method="get" className="mt-4">
        {selectedType ? <input type="hidden" name="type" value={selectedType} /> : null}
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

      {categories?.length ? (
        <FilterGroup
          title="Category"
          options={categories}
          selected={selectedType}
          hrefFor={(option) =>
            filterHref(basePath, {
              type: option.value === selectedType ? undefined : option.value,
              sku: selectedSku,
            })
          }
          clearHref={filterHref(basePath, { sku: selectedSku })}
        />
      ) : null}
      <FilterGroup
        title="Subcategory"
        options={subcategories}
        selected={selectedSub}
        hrefFor={(option) =>
          filterHref(basePath, {
            type: selectedType,
            sub: option.label.toLowerCase() === selectedSub.toLowerCase() ? undefined : option.label,
            sku: selectedSku,
          })
        }
        clearHref={filterHref(basePath, { type: selectedType, sku: selectedSku })}
      />
      <FilterGroup
        title="Child category"
        options={children}
        selected={selectedChild}
        hrefFor={(option) =>
          filterHref(basePath, {
            type: selectedType,
            sub: selectedSub,
            child: option.label.toLowerCase() === selectedChild.toLowerCase() ? undefined : option.label,
            sku: selectedSku,
          })
        }
        clearHref={filterHref(basePath, { type: selectedType, sub: selectedSub, sku: selectedSku })}
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
  hrefFor: (option: CatalogFacet) => string;
  clearHref: string;
}) {
  if (options.length === 0) {
    return null;
  }
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
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
          const value = option.value ?? option.label;
          const active = value.toLowerCase() === selected.toLowerCase();
          return (
            <li key={value}>
              <Link
                href={hrefFor(option)}
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
