import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk } from "@/lib/admin-api";
import { saveInventoryImage } from "@/lib/inventory-upload";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart form data");
  }

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return jsonError("Choose at least one image");
  }

  try {
    const urls = [];
    for (const file of files) {
      urls.push(await saveInventoryImage(file));
    }
    return jsonOk({ urls }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed");
  }
}
