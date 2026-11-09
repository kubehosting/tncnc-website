import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function safeFile(root: string, segments: string[]) {
  const base = path.resolve(root);
  const file = path.resolve(base, ...segments);
  if (file !== base && !file.startsWith(`${base}${path.sep}`)) {
    return null;
  }
  return file;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (
    !segments?.length ||
    segments.some((part) => !part || part === "." || part === ".." || part.includes("\\") || part.includes("/"))
  ) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(segments[segments.length - 1] ?? "").slice(1).toLowerCase();
  const type = contentTypes[ext];
  if (!type) {
    return new Response("Not found", { status: 404 });
  }

  const roots = [
    path.join(process.cwd(), "data", "uploads"),
    path.join(process.cwd(), "public", "uploads"),
  ];

  for (const root of roots) {
    const file = safeFile(root, segments);
    if (!file) {
      continue;
    }
    try {
      const data = await readFile(file);
      return new Response(data, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      // Try the next folder. Older uploads live under public/uploads.
    }
  }

  return new Response("Not found", { status: 404 });
}
