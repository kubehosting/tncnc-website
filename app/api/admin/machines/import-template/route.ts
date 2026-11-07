import { requireAdmin } from "@/lib/admin-auth";
import { inventoryTemplateCsv } from "@/lib/inventory-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return new Response(inventoryTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="TNCNC-inventory-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
