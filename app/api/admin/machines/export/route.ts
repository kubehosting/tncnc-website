import { requireAdmin } from "@/lib/admin-auth";
import { jsonError } from "@/lib/admin-api";
import { buildInventoryExcel } from "@/lib/inventory-excel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  try {
    const file = await buildInventoryExcel();
    return new Response(file.body, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
      return jsonError("Could not export inventory", 500);
  }
}
