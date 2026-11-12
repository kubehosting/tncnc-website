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

  const categoryId = new URL(request.url).searchParams.get("category")?.trim() || undefined;

  try {
    const file = await buildInventoryExcel(categoryId ? { categoryId } : undefined);
    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Inventory export failed.", error);
    const detail = error instanceof Error ? error.message.split("\n")[0].slice(0, 240) : "";
    return jsonError(detail ? `Could not export inventory. ${detail}` : "Could not export inventory", 500);
  }
}
