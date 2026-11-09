import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDateTime, inr } from "@/lib/admin-ui";
import { mediaUrl } from "@/lib/media-url";
import { getAdminOverview } from "@/lib/admin-overview";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();

  const cards = [
    {
      title: "Orders Pending!",
      value: data.pendingOrders,
      href: "/admin/invoices?status=pending",
      className: "from-orange-400 to-orange-600",
      icon: "$",
    },
    {
      title: "Orders Processing!",
      value: data.processingOrders,
      href: "/admin/invoices?status=processing",
      className: "from-sky-400 to-blue-600",
      icon: "🚚",
    },
    {
      title: "Orders Completed!",
      value: data.completedOrders,
      href: "/admin/invoices?status=completed",
      className: "from-emerald-400 to-teal-600",
      icon: "✓",
    },
    {
      title: "Total Products!",
      value: data.productCount,
      href: "/admin/inventory",
      className: "from-violet-500 to-indigo-700",
      icon: "🛒",
    },
    {
      title: "Total Customers!",
      value: data.customerCount,
      href: "/admin/customers",
      className: "from-rose-500 to-pink-600",
      icon: "👥",
    },
    {
      title: "Total Posts!",
      value: data.postCount,
      href: "/admin/blog",
      className: "from-lime-500 to-green-600",
      icon: "☰",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/settings/homepage"
          className="block rounded-xl border border-gold/40 bg-white px-4 py-3 text-sm text-navy shadow-sm hover:border-gold"
        >
          <span className="font-bold">Home Page Settings</span>
          <span className="mt-1 block text-slate-500">Hero, banners, and section titles</span>
        </Link>
        <Link
          href="/admin/settings/header"
          className="block rounded-xl border border-gold/40 bg-white px-4 py-3 text-sm text-navy shadow-sm hover:border-gold"
        >
          <span className="font-bold">Header & Footer</span>
          <span className="mt-1 block text-slate-500">Logo, menus, and footer copy</span>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${card.className} p-5 text-white shadow-sm`}
          >
            <p className="text-sm font-medium opacity-90">{card.title}</p>
            <p className="mt-2 text-4xl font-bold">{card.value}</p>
            <span className="mt-6 inline-block rounded bg-black/20 px-3 py-1 text-xs">
              View All
            </span>
            <span className="absolute right-5 top-6 text-4xl opacity-40">{card.icon}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Ring
          value={data.newCustomers}
          max={Math.max(data.customerCount, 1)}
          color="#f59e0b"
          label="New Customers"
          hint="Last 30 days"
        />
        <Ring
          value={data.customerCount}
          max={Math.max(data.customerCount, 1)}
          color="#06b6d4"
          label="Total Customers"
          hint="All time"
        />
        <Ring
          value={data.sales30}
          max={Math.max(data.salesAll, 1)}
          color="#8b5cf6"
          label="Total Sales"
          hint="Last 30 days"
        />
        <Ring
          value={data.salesAll}
          max={Math.max(data.salesAll, 1)}
          color="#22c55e"
          label="Total Sales"
          hint="All time"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-navy">Recent Order(s)</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Order Number</th>
                <th className="pb-2">Order Date</th>
                <th className="pb-2 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2.5">
                      <p className="font-medium text-navy">{order.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{order.customer.name}</p>
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {formatDateTime(order.issuedAt)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/invoices/${order.id}`}
                        className="rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-navy">Recent Customer(s)</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Customer Email</th>
                <th className="pb-2">Joined</th>
                <th className="pb-2 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                data.recentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="py-2.5 text-navy">
                      {customer.email || customer.name}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {formatDateTime(customer.createdAt)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-navy">Popular Product(s)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Featured Image</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Price</th>
                <th className="pb-2 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.popularProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No featured inventory yet.
                  </td>
                </tr>
              ) : (
                data.popularProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2.5">
                      <span className="relative block h-12 w-16 overflow-hidden rounded bg-slate-100">
                        {product.images[0]?.url ? (
                          <Image
                            src={mediaUrl(product.images[0].url)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-navy">{product.name}</td>
                    <td className="py-2.5 text-slate-600">{product.category.name}</td>
                    <td className="py-2.5 text-slate-600">
                      {product.used ? "Physical" : "Spare"}
                    </td>
                    <td className="py-2.5">{inr(product.price)}</td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/inventory/${product.id}`}
                        className="rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Month-to-date invoiced revenue: {inr(data.monthRevenue)}
        </p>
      </section>
    </div>
  );
}

function Ring({
  value,
  max,
  color,
  label,
  hint,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  hint: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center rounded-xl bg-white p-5 shadow-sm">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct}%, #e8eef5 0)`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-xl font-bold text-navy">
          {value}
        </div>
      </div>
      <p className="mt-3 font-medium text-navy">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
