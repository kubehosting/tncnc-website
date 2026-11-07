import { revalidatePath } from "next/cache";
import { jsonOk } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return jsonOk({ ok: true });
}
