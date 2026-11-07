import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { RecordDeleteButton } from "@/components/admin/record-delete-button";
import { SimpleRecordForm } from "@/components/admin/simple-admin-forms";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AdminPageHeader
        title="Set Coupons"
        description="Discount codes you can quote on invoices and enquiries."
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <SimpleRecordForm
          endpoint="/api/admin/coupons"
          submitLabel="Add coupon"
          fields={[
            { name: "code", label: "Code", required: true },
            { name: "percent", label: "Percent off", type: "number", required: true },
            { name: "note", label: "Note" },
          ]}
        />
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Percent</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-medium text-navy">{coupon.code}</td>
                  <td className="px-4 py-3">{coupon.percent}%</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.note ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <RecordDeleteButton href={`/api/admin/coupons/${coupon.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
