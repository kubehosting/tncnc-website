import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getSessionSecret,
  parseAdminSession,
  readCookie,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function getAdminSecret() {
  return getSessionSecret();
}

export async function hasValidAdminAuth(request: Request) {
  const expected = getAdminSecret();
  if (!expected) {
    return false;
  }

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const fromCustom = request.headers.get("x-admin-api-key")?.trim() ?? "";
  const provided = bearer || fromCustom;
  if (provided && timingSafeEqual(provided, expected)) {
    return true;
  }

  return (await parseAdminSession(readCookie(request, ADMIN_SESSION_COOKIE), expected)) !== null;
}

export async function requireAdmin(request: Request) {
  if (!getAdminSecret()) {
    return NextResponse.json(
      { error: "Admin API is not configured. Set ADMIN_API_KEY in .env." },
      { status: 503 },
    );
  }

  if (!(await hasValidAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await getAdminActor(request);
  if (actor === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function getAdminActor(request: Request) {
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const fromCustom = request.headers.get("x-admin-api-key")?.trim() ?? "";
  if (bearer || fromCustom) {
    return { kind: "legacy" as const };
  }

  const parsed = await parseAdminSession(
    readCookie(request, ADMIN_SESSION_COOKIE),
    getAdminSecret(),
  );
  if (!parsed) {
    return null;
  }
  if (parsed.kind === "legacy") {
    return { kind: "legacy" as const };
  }
  const user = await prisma.adminUser.findUnique({ where: { id: parsed.userId } });
  if (!user?.active) {
    return null;
  }
  return { kind: "user" as const, user };
}
