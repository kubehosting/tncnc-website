import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { RecordDeleteButton } from "@/components/admin/record-delete-button";
import { SimpleRecordForm } from "@/components/admin/simple-admin-forms";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Manage Country" };
export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  const regions = await prisma.serviceRegion.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <AdminPageHeader
        title="Manage Country"
        description="States and countries you sell into. Used for pan-India and export coverage."
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <SimpleRecordForm
          endpoint="/api/admin/regions"
          submitLabel="Add region"
          fields={[
            { name: "name", label: "State / region", required: true },
            { name: "country", label: "Country" },
          ]}
        />
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regions.map((region) => (
                <tr key={region.id}>
                  <td className="px-4 py-3 font-medium text-navy">{region.name}</td>
                  <td className="px-4 py-3">{region.country}</td>
                  <td className="px-4 py-3 text-right">
                    <RecordDeleteButton href={`/api/admin/regions/${region.id}`} />
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
