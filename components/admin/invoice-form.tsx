"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { inr } from "@/lib/admin-ui";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
};
type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  price: string | null;
  status: string;
  category: { name: string };
};

type Line = {
  machineId: string;
  quantity: number;
  unitPrice: number;
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-gold focus:ring-2";

export function InvoiceForm({
  customers,
  inventory,
}: {
  customers: Customer[];
  inventory: InventoryItem[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"draft" | "final" | null>(null);

  const available = inventory.filter((item) => item.stock > 0);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }, [lines, taxRate]);

  function addLine() {
    const first = available.find((item) => !lines.some((line) => line.machineId === item.id)) ?? available[0];
    if (!first) {
      setError("No inventory items with stock are available.");
      return;
    }
    setLines([
      ...lines,
      {
        machineId: first.id,
        quantity: 1,
        unitPrice: first.price ? Number(first.price) : 0,
      },
    ]);
    setError("");
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, i) => {
        if (i !== index) {
          return line;
        }
        const next = { ...line, ...patch };
        if (patch.machineId) {
          const item = inventory.find((row) => row.id === patch.machineId);
          if (item?.price) {
            next.unitPrice = Number(item.price);
          }
        }
        return next;
      }),
    );
  }

  async function submit(finalize: boolean) {
    setPending(finalize ? "final" : "draft");
    setError("");
    if (lines.length === 0) {
      setError("Add at least one inventory item.");
      setPending(null);
      return;
    }
    try {
      await adminFetch("/api/admin/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerId: mode === "existing" ? customerId : undefined,
          customer: mode === "new" ? newCustomer : undefined,
          taxRate,
          notes,
          finalize,
          items: lines.map((line) => ({
            machineId: line.machineId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      });
      router.push("/admin/invoices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save invoice");
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === "existing" ? "bg-navy text-white" : "bg-slate-100"}`}
          >
            Existing customer
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === "new" ? "bg-navy text-white" : "bg-slate-100"}`}
          >
            Add new customer
          </button>
        </div>
        {mode === "existing" ? (
          <label className="block text-sm font-medium text-slate-700">
            Customer
            <select className={`${field} mt-1`} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.company ? ` · ${customer.company}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Name
              <input className={`${field} mt-1`} value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} required />
            </label>
            <label className="text-sm font-medium">
              Email
              <input className={`${field} mt-1`} type="email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} />
            </label>
            <label className="text-sm font-medium">
              Phone
              <input className={`${field} mt-1`} value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} />
            </label>
            <label className="text-sm font-medium">
              Company
              <input className={`${field} mt-1`} value={newCustomer.company} onChange={(event) => setNewCustomer({ ...newCustomer, company: event.target.value })} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Address
              <input className={`${field} mt-1`} value={newCustomer.address} onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })} />
            </label>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Line items</h2>
          <button type="button" onClick={addLine} className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-navy">
            Add from inventory
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">No items yet. Add a machine or spare part from inventory.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, index) => {
              const item = inventory.find((row) => row.id === line.machineId);
              return (
                <div key={`${line.machineId}-${index}`} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_7rem_8rem_auto]">
                  <select
                    className={field}
                    value={line.machineId}
                    onChange={(event) => updateLine(index, { machineId: event.target.value })}
                  >
                    {inventory.map((row) => (
                      <option key={row.id} value={row.id} disabled={row.stock < 1 && row.id !== line.machineId}>
                        {row.name} · {row.category.name} · stock {row.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={item?.stock ?? 1}
                    className={field}
                    value={line.quantity}
                    onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })}
                  />
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={line.unitPrice}
                    onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })}
                  />
                  <button type="button" className="text-sm font-semibold text-rose-700" onClick={() => setLines(lines.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <label className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium shadow-sm">
          Notes
          <textarea className={`${field} mt-1 min-h-28`} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium">
            GST / tax rate (%)
            <input
              type="number"
              min={0}
              className={`${field} mt-1`}
              value={taxRate}
              onChange={(event) => setTaxRate(Number(event.target.value))}
            />
          </label>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{inr(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax</dt>
              <dd>{inr(totals.taxAmount)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-navy">
              <dt>Total</dt>
              <dd>{inr(totals.total)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => submit(false)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pending === "draft" ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => submit(true)}
          className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
        >
          {pending === "final" ? "Finalizing…" : "Finalize invoice"}
        </button>
      </div>
    </div>
  );
}
