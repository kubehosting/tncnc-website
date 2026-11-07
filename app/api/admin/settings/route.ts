import { asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { saveSiteSettings, settingDefaults } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  const patch: Record<string, string> = {};
  for (const key of Object.keys(settingDefaults)) {
    const value = asString(parsed.data[key]);
    if (value !== undefined) {
      patch[key] = value;
    } else if (typeof parsed.data[key] === "string") {
      patch[key] = parsed.data[key] as string;
    }
  }
  if (Object.keys(patch).length === 0) {
    return jsonError("No settings to save");
  }
  try {
    const settings = await saveSiteSettings(patch);
    return jsonOk({ settings });
  } catch (error) {
    return prismaError(error);
  }
}
