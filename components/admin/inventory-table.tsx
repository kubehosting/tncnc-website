"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/admin/admin-ui";
import { PriceTag } from "@/components/price-tag";
import { adminFetch } from "@/lib/admin-fetch";

type Row = {
  id: string;
  name: string;
  brand: string | null;
  stock: number;
  status: "AVAILABLE" | "SOLD";
  category: { id: string; name: string };
  sku: string | null;
  subcategory: string | null;
  childCategory: string | null;
  price: string | null;
  previousPrice: string | null;
};

type Category = {
  id: string;
  name: string;
};

export function InventoryBoard({ rows, categories }: { rows: Row[]; categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const ordered = [...categories];
    for (const row of rows) {
      if (!ordered.some((category) => category.id === row.category.id)) {
        ordered.push({ id: row.category.id, name: row.category.name });
      }
    }
    return ordered.map((category) => {
      const products = rows.filter((row) => row.category.id === category.id);
      return {
        ...category,
        products,
        stock: products.reduce((sum, row) => sum + row.stock, 0),
      };
    });
  }, [categories, rows]);

  const needle = query.trim().toLowerCase();
  const visibleGroups = groups
    .filter((group) => selected === "all" || group.id === selected)
    .map((group) => ({
      ...group,
      products: needle
        ? group.products.filter((row) =>
            `${row.name} ${row.brand ?? ""}`.toLowerCase().includes(needle),
          )
        : group.products,
    }))
    .filter((group) => {
      if (needle || selected === "all") {
        return group.products.length > 0;
      }
      return true;
    });

  const totalStock = rows.reduce((sum, row) => sum + row.stock, 0);

  async function onDelete(row: Row) {
    if (!window.confirm(`Delete “${row.name}” from inventory?`)) {
      return;
    }
    setError("");
    try {
      await adminFetch(`/api/admin/machines/${row.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <CategoryBox
          label="All products"
          count={rows.length}
          stock={totalStock}
          active={selected === "all"}
          onClick={() => setSelected("all")}
        />
        {groups.map((group) => (
          <CategoryBox
            key={group.id}
            label={group.name}
            count={group.products.length}
            stock={group.stock}
            active={selected === group.id}
            onClick={() => setSelected(group.id)}
          />
        ))}
      </div>

      <label className="block">
        <span className="sr-only">Find a product</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a product by name or brand"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gold"
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No machines or spare parts yet.
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No products match that search.
        </div>
      ) : (
        visibleGroups.map((group) => (
          <section key={group.id}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{group.name}</h2>
              <p className="text-sm font-semibold text-slate-600">
                {group.products.length} {group.products.length === 1 ? "product" : "products"}
              </p>
            </div>
            {group.products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
                No products in this category yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.products.map((row) => (
                  <article
                    key={row.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <h3 className="font-semibold leading-snug text-navy">{row.name}</h3>
                    {row.sku ? <p className="mt-1 text-xs font-semibold text-slate-500">SKU {row.sku}</p> : null}
                    <p className="mt-1 text-xs text-slate-500">
                      {[row.category.name, row.subcategory, row.childCategory].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{row.brand?.trim() || "No brand"}</p>
                    <div className="mt-2">
                      <PriceTag
                        price={row.price != null ? Number(row.price) : null}
                        previousPrice={row.previousPrice != null ? Number(row.previousPrice) : null}
                        size="sm"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-600">
                        Stock <span className="font-semibold text-navy">{row.stock}</span>
                      </p>
                      <StatusPill
                        value={row.status}
                        tone={row.status === "AVAILABLE" ? "green" : "slate"}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/admin/inventory/${row.id}`}
                        className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold text-white hover:bg-navy/90"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

function CategoryBox({
  label,
  count,
  stock,
  active,
  onClick,
}: {
  label: string;
  count: number;
  stock: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
        active
          ? "border-gold bg-amber-50 ring-2 ring-gold/40"
          : "border-slate-200 bg-white hover:border-gold"
      }`}
    >
      <p className="line-clamp-2 min-h-8 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold leading-none text-navy">{count}</p>
      <p className="mt-2 text-xs text-slate-500">
        {count === 1 ? "product" : "products"} · {stock} in stock
      </p>
    </button>
  );
}
