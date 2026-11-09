"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { adminFetch } from "@/lib/admin-fetch";

type Category = { id: string; name: string };
type Machine = {
  id: string;
  name: string;
  brand: string | null;
  year: number | null;
  controller: string | null;
  condition: string | null;
  location: string | null;
  price: string | null;
  stock: number;
  status: "AVAILABLE" | "SOLD";
  type: string | null;
  description: string | null;
  categoryId: string;
  used: boolean;
  sku: string | null;
  subcategory: string | null;
  childCategory: string | null;
  previousPrice: string | null;
  images: { url: string }[];
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2";

export function InventoryForm({
  categories,
  machine,
  subcategories = [],
  childCategories = [],
}: {
  categories: Category[];
  machine?: Machine;
  subcategories?: string[];
  childCategories?: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [existing, setExisting] = useState(machine?.images.map((image) => image.url) ?? []);
  const [files, setFiles] = useState<File[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      let uploaded: string[] = [];
      if (files.length) {
        const payload = new FormData();
        files.forEach((file) => payload.append("files", file));
        const result = (await adminFetch("/api/admin/uploads", {
          method: "POST",
          body: payload,
        })) as { urls: string[] };
        uploaded = result.urls;
      }

      const body = {
        name: String(form.get("name") ?? ""),
        categoryId: String(form.get("categoryId") ?? ""),
        brand: String(form.get("brand") ?? ""),
        year: form.get("year") ? Number(form.get("year")) : null,
        controller: String(form.get("controller") ?? ""),
        condition: String(form.get("condition") ?? ""),
        location: String(form.get("location") ?? ""),
        stock: Number(form.get("stock") ?? 1),
        price: form.get("price") ? Number(form.get("price")) : null,
        previousPrice: form.get("previousPrice") ? Number(form.get("previousPrice")) : null,
        sku: String(form.get("sku") ?? ""),
        subcategory: String(form.get("subcategory") ?? ""),
        childCategory: String(form.get("childCategory") ?? ""),
        status: String(form.get("status") ?? "AVAILABLE"),
        type: String(form.get("type") ?? ""),
        description: String(form.get("description") ?? ""),
        used: form.get("kind") !== "part",
        images: [...existing, ...uploaded],
      };

      if (machine) {
        await adminFetch(`/api/admin/machines/${machine.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/admin/machines", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      router.push("/admin/inventory");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Name
          <input name="name" required defaultValue={machine?.name} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            name="categoryId"
            required
            defaultValue={machine?.categoryId ?? ""}
            className={`${field} mt-1`}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Item type
          <select name="kind" defaultValue={machine?.used === false ? "part" : "machine"} className={`${field} mt-1`}>
            <option value="machine">Machine</option>
            <option value="part">Spare part</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Brand
          <input name="brand" defaultValue={machine?.brand ?? ""} className={`${field} mt-1`} placeholder="Mazak, FANUC…" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Year
          <input name="year" type="number" min="1970" max="2100" defaultValue={machine?.year ?? ""} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Controller
          <input
            name="controller"
            defaultValue={machine?.controller ?? ""}
            className={`${field} mt-1`}
            placeholder="Fanuc, Siemens, Mazatrol…"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Location
          <input name="location" defaultValue={machine?.location ?? ""} className={`${field} mt-1`} placeholder="Chennai, India" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Condition
          <input name="condition" defaultValue={machine?.condition ?? ""} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Machine type / spec
          <input name="type" defaultValue={machine?.type ?? ""} className={`${field} mt-1`} placeholder="Vertical Machining Center" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Stock level
          <input name="stock" type="number" min="0" required defaultValue={machine?.stock ?? 1} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          SKU
          <input name="sku" defaultValue={machine?.sku ?? ""} className={`${field} mt-1`} placeholder="10000001" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Subcategory
          <input
            name="subcategory"
            list="subcategory-options"
            defaultValue={machine?.subcategory ?? ""}
            className={`${field} mt-1`}
            placeholder="Cnc Lathe"
          />
          <datalist id="subcategory-options">
            {subcategories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Child category
          <input
            name="childCategory"
            list="child-category-options"
            defaultValue={machine?.childCategory ?? ""}
            className={`${field} mt-1`}
            placeholder="Servo Motor"
          />
          <datalist id="child-category-options">
            {childCategories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Previous price (INR)
          <input
            name="previousPrice"
            type="number"
            min="0"
            defaultValue={machine?.previousPrice ?? ""}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Current price (INR)
          <input
            name="price"
            type="number"
            min="0"
            defaultValue={machine?.price ?? ""}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select name="status" defaultValue={machine?.status ?? "AVAILABLE"} className={`${field} mt-1`}>
            <option value="AVAILABLE">Available</option>
            <option value="SOLD">Sold</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Description
          <textarea name="description" defaultValue={machine?.description ?? ""} className={`${field} mt-1 min-h-28`} />
        </label>
      </div>

      <ImageUploadField
        existing={existing}
        onExistingChange={setExisting}
        files={files}
        onFilesChange={setFiles}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : machine ? "Save changes" : "Create item"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/inventory")}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
