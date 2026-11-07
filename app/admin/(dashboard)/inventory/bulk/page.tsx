import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { BulkUploadForm } from "@/components/admin/bulk-upload-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Bulk Product Import" };
export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true },
  });

  return (
    <>
      <AdminPageHeader
        title="Bulk Product Import"
        description="Import machines and spare parts from CSV or Excel. Existing slugs are updated."
      />
      <BulkUploadForm categories={categories} />
    </>
  );
}
