"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  clearCart,
  readCart,
  removeFromCart,
  setCartQuantity,
  subscribeCart,
  type CartLine,
} from "@/lib/cart-client";

type QuoteItem = {
  slug: string;
  name: string;
  price: number | null;
  stock: number;
  image: string | null;
  available: boolean;
};

type Buyer = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
};

type PlacedInvoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CartView({ customer }: { customer: Buyer | null }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [taxRate, setTaxRate] = useState(18);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<PlacedInvoice | null>(null);
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [buyerEmail, setBuyerEmail] = useState(customer?.email ?? "");

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    setReady(true);
    return subscribeCart(sync);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const slugs = lines.map((line) => line.slug).join(",");
    const controller = new AbortController();
    fetch(`/api/cart?slugs=${encodeURIComponent(slugs)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load the cart");
        }
        return response.json() as Promise<{ taxRate: number; items: QuoteItem[] }>;
      })
      .then((payload) => {
        setTaxRate(payload.taxRate);
        setItems(payload.items);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Could not load the cart");
      });
    return () => controller.abort();
  }, [lines, ready]);

  const rows = lines.map((line) => ({
    ...line,
    item: items.find((entry) => entry.slug === line.slug),
  }));
  function linePrice(row: (typeof rows)[number]) {
    if (row.item?.price != null) {
      return row.item.price;
    }
    const offer = Number(offers[row.slug]);
    return Number.isFinite(offer) && offer > 0 ? offer : null;
  }
  const priced = rows.every(
    (row) => row.item?.available && linePrice(row) != null && row.quantity <= (row.item?.stock ?? 0),
  );
  const subtotal = rows.reduce((sum, row) => sum + (linePrice(row) ?? 0) * row.quantity, 0);
  const tax = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + tax;

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? customer?.email ?? "");
    setBuyerEmail(email);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({
            ...line,
            unitPrice: offers[line.slug] ? Number(offers[line.slug]) : undefined,
          })),
          customer: {
            name: String(form.get("name") ?? ""),
            email,
            phone: String(form.get("phone") ?? ""),
            company: String(form.get("company") ?? ""),
            address: String(form.get("address") ?? ""),
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        invoice?: PlacedInvoice;
      } | null;
      if (!response.ok || !payload?.invoice) {
        throw new Error(payload?.error ?? "Could not create the invoice");
      }
      clearCart();
      setInvoice(payload.invoice);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not create the invoice");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading your cart…</p>;
  }

  if (invoice) {
    const signup = `/account/signup?email=${encodeURIComponent(buyerEmail)}&next=${encodeURIComponent(`/account/invoices/${invoice.id}`)}`;
    return (
      <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">Order received</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy">{invoice.invoiceNumber}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          This order is now a draft invoice for {money(invoice.totalAmount)} in the TNCNC invoice system. The
          sales desk will confirm it before stock is reserved.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {customer ? (
            <Link href={`/account/invoices/${invoice.id}`} className="rounded bg-navy px-4 py-2 text-sm font-bold text-white">
              View invoice
            </Link>
          ) : (
            <Link href={signup} className="rounded bg-navy px-4 py-2 text-sm font-bold text-white">
              Create an account to track it
            </Link>
          )}
          <Link href="/machines" className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-navy">
            Continue browsing
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h1 className="text-2xl font-extrabold text-navy">Your cart</h1>
          <p className="mt-1 text-sm text-slate-500">
            {lines.length ? `${lines.length} product${lines.length === 1 ? "" : "s"} ready for an invoice` : "No products yet"}
          </p>
        </div>
        {lines.length === 0 ? (
          <div className="px-5 py-10 text-sm text-slate-600">
            <p>Your cart is empty.</p>
            <Link href="/machines" className="mt-4 inline-block font-bold text-navy underline">
              Browse machines
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.slug} className="flex gap-4 px-5 py-4">
                <Link href={`/machines/${row.slug}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {row.item?.image ? (
                    <Image src={row.item.image} alt="" fill className="object-cover" sizes="112px" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/machines/${row.slug}`} className="font-bold text-navy hover:underline">
                    {row.item?.name ?? "Loading…"}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {row.item && !row.item.available
                      ? "No longer available"
                      : row.item?.price == null
                        ? "Price on request"
                        : money(row.item.price)}
                  </p>
                  {row.item?.available && row.item.price == null ? (
                    <label className="mt-2 block text-xs font-semibold text-slate-500">
                      Your price (INR)
                      <input
                        type="number"
                        min={1}
                        required
                        value={offers[row.slug] ?? ""}
                        onChange={(event) =>
                          setOffers((current) => ({ ...current, [row.slug]: event.target.value }))
                        }
                        className="ml-2 w-28 rounded border border-slate-300 px-2 py-1 text-sm text-navy"
                      />
                    </label>
                  ) : null}
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={row.item?.stock || undefined}
                        value={row.quantity}
                        onChange={(event) => setCartQuantity(row.slug, Number(event.target.value))}
                        className="ml-2 w-16 rounded border border-slate-300 px-2 py-1 text-sm text-navy"
                      />
                    </label>
                    <button type="button" onClick={() => removeFromCart(row.slug)} className="text-xs font-semibold text-red-700">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-navy">
                  {linePrice(row) != null ? money(linePrice(row)! * row.quantity) : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={checkout} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Invoice</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-semibold text-navy">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">GST {taxRate}%</dt>
            <dd className="font-semibold text-navy">{money(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <dt className="font-bold text-navy">Total</dt>
            <dd className="font-extrabold text-navy">{money(total)}</dd>
          </div>
        </dl>

        {customer ? (
          <p className="mt-4 text-sm text-slate-600">
            This invoice will be issued to <span className="font-semibold text-navy">{customer.name}</span> ({customer.email}).
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Tell us who the invoice is for. Sign in if you already have an account.</p>
        )}

        <div className="mt-4 grid gap-3">
          {!customer ? (
            <>
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </>
          ) : null}
          <Field label="Phone" name="phone" required={!customer?.phone} defaultValue={customer?.phone ?? ""} />
          <Field label="Business name" name="company" defaultValue={customer?.company ?? ""} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Address</span>
            <textarea
              name="address"
              rows={3}
              defaultValue={customer?.address ?? ""}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {!priced && lines.length > 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Enter a price for every item that is still on request, and remove anything that is no longer available.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || lines.length === 0 || !priced}
          className="mt-4 w-full rounded bg-gold px-4 py-3 text-sm font-bold text-navy disabled:opacity-50"
        >
          {pending ? "Creating invoice…" : "Create invoice"}
        </button>
        {!customer ? (
          <p className="mt-3 text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link href="/account/login?next=/cart" className="font-semibold text-navy underline">
              Sign in
            </Link>
          </p>
        ) : null}
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
