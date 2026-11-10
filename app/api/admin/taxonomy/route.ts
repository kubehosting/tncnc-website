import { requireAdmin } from "@/lib/admin-auth";
import { asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { TaxonomyError, applyTaxonomyAction, type TaxonomyAction } from "@/lib/category-taxonomy";

export const dynamic = "force-dynamic";

const actions = new Set(["addSub", "renameSub", "removeSub", "addChild", "renameChild", "removeChild"]);

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  const action = asString(parsed.data.action) ?? "";
  const categoryId = asString(parsed.data.categoryId) ?? "";
  if (!actions.has(action)) {
    return jsonError("Unknown action");
  }
  if (!categoryId) {
    return jsonError("Choose a main category");
  }

  const input = {
    action,
    categoryId,
    sub: asString(parsed.data.sub) ?? "",
    child: asString(parsed.data.child) ?? "",
    name: asString(parsed.data.name) ?? "",
  } as TaxonomyAction;

  try {
    await applyTaxonomyAction(input);
    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof TaxonomyError) {
      return jsonError(error.message);
    }
    return prismaError(error);
  }
}
