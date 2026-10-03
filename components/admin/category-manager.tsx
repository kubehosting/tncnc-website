"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  kind: "MACHINE" | "SPARE";
  sortOrder: number;
  _count: { machines: number };
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2";

export function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"MACHINE" | "SPARE">("MACHINE");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setKind(category.kind);
    setSortOrder(String(category.sortOrder));
    setImageUrl(category.imageUrl ?? "");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setKind("MACHINE");
    setSortOrder("0");
    setImageUrl("");
    setError("");
  }

  async function onUpload(file: File) {
    const body = new FormData();
    body.append("files", file);
    const payload = (await adminFetch("/api/admin/uploads", {
      method: "POST",
      body,
    })) as { urls?: string[] };
    const url = payload.urls?.[0];
    if (!url) {
      throw new Error("Upload did not return an image URL");
    }
    setImageUrl(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const payload = {
      name,
      description,
      kind,
      sortOrder: Number(sortOrder) || 0,
      imageUrl: imageUrl.trim() || null,
    };
    try {
      if (editingId) {
        await adminFetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(category: Category) {
    if (category._count.machines > 0) {
      setError("Remove or recategorize inventory items before deleting this category.");
      return;
    }
    if (!window.confirm(`Delete category “${category.name}”?`)) {
      return;
    }
    setPending(true);
    setError("");
    try {
      await adminFetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      if (editingId === category.id) {
        resetForm();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <form
        onSubmit={onSubmit}
        className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-navy">
          {editingId ? "Edit category" : "Add category"}
        </h2>
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            className={`${field} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="CNC Lathe"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Type
          <select
            className={`${field} mt-1`}
            value={kind}
            onChange={(event) => setKind(event.target.value as "MACHINE" | "SPARE")}
          >
            <option value="MACHINE">Machine category (homepage row)</option>
            <option value="SPARE">Spare parts category</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Display order
          <input
            className={`${field} mt-1`}
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            className={`${field} mt-1 min-h-24`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes for this machine type"
          />
        </label>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Category image</p>
          {imageUrl ? (
            <figure className="relative mb-2 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
              <button
                type="button"
                className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-rose-700"
                onClick={() => setImageUrl("")}
              >
                Remove
              </button>
            </figure>
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-gold"
          >
            Upload photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              setPending(true);
              setError("");
              try {
                await onUpload(file);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed");
              } finally {
                setPending(false);
              }
            }}
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : editingId ? "Update" : "Add category"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initial.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                      {category.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <div>
                      <p className="font-medium text-navy">{category.name}</p>
                      <p className="text-xs text-slate-500">{category.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {category.kind === "SPARE" ? "Spare" : "Machine"}
                </td>
                <td className="px-4 py-3">{category.sortOrder}</td>
                <td className="px-4 py-3">{category._count.machines}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-3 text-sm font-semibold text-navy hover:underline"
                    onClick={() => startEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-rose-700 hover:underline"
                    onClick={() => onDelete(category)}
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
  );
}
