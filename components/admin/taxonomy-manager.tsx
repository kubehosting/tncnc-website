"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export type TaxonomyCategory = { id: string; name: string; kind: "MACHINE" | "SPARE" };
export type TaxonomyTrees = Record<
  string,
  { name: string; count: number; children: { name: string; count: number }[] }[]
>;

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500";

async function runAction(body: Record<string, string>) {
  await adminFetch("/api/admin/taxonomy", { method: "POST", body: JSON.stringify(body) });
}

function confirmDelete(label: string, count: number, extra = "") {
  const usage =
    count > 0
      ? `\n\n${count} product${count === 1 ? " uses" : "s use"} it. It will be cleared from ${
          count === 1 ? "that product" : "those products"
        }${extra}.`
      : "";
  return window.confirm(`Delete “${label}”?${usage}`);
}

function ProductCount({ count }: { count: number }) {
  return (
    <span
      className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        count ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {count}
    </span>
  );
}

function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
  includeAll = false,
  label = "Main category",
}: {
  categories: TaxonomyCategory[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  includeAll?: boolean;
  label?: string;
}) {
  const machines = categories.filter((category) => category.kind !== "SPARE");
  const spares = categories.filter((category) => category.kind === "SPARE");
  return (
    <select
      aria-label={label}
      className={field}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      required={!includeAll}
    >
      <option value="" disabled={!includeAll}>
        {includeAll ? "All main categories" : "Select main category"}
      </option>
      {machines.length ? (
        <optgroup label="Machines">
          {machines.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      {spares.length ? (
        <optgroup label="Spare parts">
          {spares.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

function useSaving() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(body: Record<string, string>, done: string) {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await runAction(body);
      setMessage(done);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, error, message, save, setError };
}

export function SubcategoryManager({
  categories,
  trees,
  initialCategory = "",
}: {
  categories: TaxonomyCategory[];
  trees: TaxonomyTrees;
  initialCategory?: string;
}) {
  const { pending, error, message, save } = useSaving();
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ categoryId: string; sub: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");

  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return categories
      .filter((category) => !filterCategory || category.id === filterCategory)
      .flatMap((category) =>
        (trees[category.id] ?? []).map((node) => ({
          categoryId: category.id,
          categoryName: category.name,
          ...node,
        })),
      )
      .filter(
        (row) =>
          !needle ||
          row.name.toLowerCase().includes(needle) ||
          row.categoryName.toLowerCase().includes(needle),
      );
  }, [categories, trees, filterCategory, search]);

  function startEdit(row: { categoryId: string; name: string }) {
    setEditing({ categoryId: row.categoryId, sub: row.name });
    setCategoryId(row.categoryId);
    setName(row.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setName("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = editing
      ? await save(
          { action: "renameSub", categoryId: editing.categoryId, sub: editing.sub, name },
          `Renamed “${editing.sub}” to “${name.trim()}”.`,
        )
      : await save(
          { action: "addSub", categoryId, name },
          `Added “${name.trim()}” to ${categoryName.get(categoryId) ?? "the category"}.`,
        );
    if (ok) {
      setEditing(null);
      setName("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <form
        onSubmit={onSubmit}
        className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-navy">{editing ? "Edit sub category" : "Add sub category"}</h2>
        <label className="block text-sm font-medium text-slate-700">
          Main category
          <div className="mt-1">
            <CategorySelect
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              disabled={Boolean(editing)}
            />
          </div>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Sub category name
          <input
            className={`${field} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="CNC Lathe"
          />
        </label>
        {editing ? (
          <p className="text-xs text-slate-500">
            Renaming updates every product in this sub category. Use the same name as another sub
            category to merge them.
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Update" : "Add sub category"}
          </button>
          {editing ? (
            <button type="button" onClick={cancelEdit} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sub categories"
            className={field}
          />
          <div className="sm:w-64">
            <CategorySelect
              categories={categories}
              value={filterCategory}
              onChange={setFilterCategory}
              includeAll
              label="Filter by main category"
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Main category</th>
                  <th className="px-4 py-3">Sub category</th>
                  <th className="px-4 py-3">Child categories</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <EmptyRow colSpan={5}>
                    {search || filterCategory
                      ? "No sub categories match this search."
                      : "No sub categories yet. Add one with the form, or import products with a subcategory column."}
                  </EmptyRow>
                ) : null}
                {rows.map((row) => (
                  <tr key={`${row.categoryId}-${row.name}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{row.categoryName}</td>
                    <td className="px-4 py-3 font-medium text-navy">{row.name}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/categories/child?category=${row.categoryId}&sub=${encodeURIComponent(row.name)}`}
                        className="text-sm text-sky-700 hover:underline"
                      >
                        {row.children.length} child
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ProductCount count={row.count} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        className="mr-3 text-sm font-semibold text-navy hover:underline"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50"
                        onClick={async () => {
                          if (!confirmDelete(row.name, row.count, " along with its child categories")) {
                            return;
                          }
                          if (await save({ action: "removeSub", categoryId: row.categoryId, sub: row.name }, `Deleted “${row.name}”.`)) {
                            if (editing?.sub === row.name && editing.categoryId === row.categoryId) {
                              cancelEdit();
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {rows.length} sub categor{rows.length === 1 ? "y" : "ies"}
        </p>
      </div>
    </div>
  );
}

export function ChildCategoryManager({
  categories,
  trees,
  initialCategory = "",
  initialSub = "",
}: {
  categories: TaxonomyCategory[];
  trees: TaxonomyTrees;
  initialCategory?: string;
  initialSub?: string;
}) {
  const { pending, error, message, save } = useSaving();
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sub, setSub] = useState(initialSub);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ categoryId: string; sub: string; child: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterSub, setFilterSub] = useState(initialSub);
  const [search, setSearch] = useState("");

  const subOptions = trees[categoryId] ?? [];
  const filterSubOptions = filterCategory ? (trees[filterCategory] ?? []) : [];

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return categories
      .filter((category) => !filterCategory || category.id === filterCategory)
      .flatMap((category) =>
        (trees[category.id] ?? [])
          .filter((node) => !filterSub || node.name.toLowerCase() === filterSub.toLowerCase())
          .flatMap((node) =>
            node.children.map((child) => ({
              categoryId: category.id,
              categoryName: category.name,
              sub: node.name,
              ...child,
            })),
          ),
      )
      .filter(
        (row) =>
          !needle ||
          row.name.toLowerCase().includes(needle) ||
          row.sub.toLowerCase().includes(needle) ||
          row.categoryName.toLowerCase().includes(needle),
      );
  }, [categories, trees, filterCategory, filterSub, search]);

  function startEdit(row: { categoryId: string; sub: string; name: string }) {
    setEditing({ categoryId: row.categoryId, sub: row.sub, child: row.name });
    setCategoryId(row.categoryId);
    setSub(row.sub);
    setName(row.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setName("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = editing
      ? await save(
          { action: "renameChild", categoryId: editing.categoryId, sub: editing.sub, child: editing.child, name },
          `Renamed “${editing.child}” to “${name.trim()}”.`,
        )
      : await save({ action: "addChild", categoryId, sub, name }, `Added “${name.trim()}” under ${sub}.`);
    if (ok) {
      setEditing(null);
      setName("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <form
        onSubmit={onSubmit}
        className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-navy">{editing ? "Edit child category" : "Add child category"}</h2>
        <label className="block text-sm font-medium text-slate-700">
          Main category
          <div className="mt-1">
            <CategorySelect
              categories={categories}
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                setSub("");
              }}
              disabled={Boolean(editing)}
            />
          </div>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Sub category
          <select
            className={`${field} mt-1`}
            value={sub}
            onChange={(event) => setSub(event.target.value)}
            disabled={Boolean(editing) || !categoryId}
            required
          >
            <option value="" disabled>
              {!categoryId
                ? "Choose a main category first"
                : subOptions.length
                  ? "Select sub category"
                  : "No sub categories in this category"}
            </option>
            {subOptions.map((node) => (
              <option key={node.name} value={node.name}>
                {node.name}
              </option>
            ))}
          </select>
          {categoryId && !subOptions.length ? (
            <Link
              href={`/admin/categories/sub?category=${categoryId}`}
              className="mt-1 block text-xs font-semibold text-sky-700 hover:underline"
            >
              Add a sub category first →
            </Link>
          ) : null}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Child category name
          <input
            className={`${field} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Fanuc Control"
          />
        </label>
        {editing ? (
          <p className="text-xs text-slate-500">Renaming updates every product with this child category.</p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Update" : "Add child category"}
          </button>
          {editing ? (
            <button type="button" onClick={cancelEdit} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_12rem_12rem]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search child categories"
            className={field}
          />
          <CategorySelect
            categories={categories}
            value={filterCategory}
            onChange={(value) => {
              setFilterCategory(value);
              setFilterSub("");
            }}
            includeAll
            label="Filter by main category"
          />
          <select
            aria-label="Filter by sub category"
            className={field}
            value={filterSub}
            onChange={(event) => setFilterSub(event.target.value)}
            disabled={!filterCategory}
          >
            <option value="">{filterCategory ? "All sub categories" : "Pick a main category"}</option>
            {filterSubOptions.map((node) => (
              <option key={node.name} value={node.name}>
                {node.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Main category</th>
                  <th className="px-4 py-3">Sub category</th>
                  <th className="px-4 py-3">Child category</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <EmptyRow colSpan={5}>
                    {search || filterCategory
                      ? "No child categories match these filters."
                      : "No child categories yet. Add one with the form, or import products with a child category column."}
                  </EmptyRow>
                ) : null}
                {rows.map((row) => (
                  <tr key={`${row.categoryId}-${row.sub}-${row.name}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{row.categoryName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.sub}</td>
                    <td className="px-4 py-3 font-medium text-navy">{row.name}</td>
                    <td className="px-4 py-3">
                      <ProductCount count={row.count} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        className="mr-3 text-sm font-semibold text-navy hover:underline"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50"
                        onClick={async () => {
                          if (!confirmDelete(row.name, row.count)) {
                            return;
                          }
                          const ok = await save(
                            { action: "removeChild", categoryId: row.categoryId, sub: row.sub, child: row.name },
                            `Deleted “${row.name}”.`,
                          );
                          if (ok && editing?.child === row.name && editing.sub === row.sub) {
                            cancelEdit();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {rows.length} child categor{rows.length === 1 ? "y" : "ies"}
        </p>
      </div>
    </div>
  );
}
