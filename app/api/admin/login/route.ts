import { NextResponse } from "next/server";
import { getAdminSecret } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  createAdminUserSessionToken,
  createLegacyAdminSessionToken,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { asString, jsonError, readJson } from "@/lib/admin-api";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function passwordsMatch(provided: string, expected: string) {
  if (provided.length !== expected.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_API_KEY in .env." },
      { status: 503 },
    );
  }

  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const email = asString(parsed.data.email);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";
  if (!password) {
    return jsonError("Password is required");
  }

  if (email) {
    const user = await prisma.adminUser.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (user?.active && (await verifyPassword(password, user.passwordHash))) {
      const response = NextResponse.json({ ok: true, name: user.name });
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        await createAdminUserSessionToken(secret, user.id),
        sessionCookieOptions(),
      );
      return response;
    }
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (passwordsMatch(password, secret)) {
    const response = NextResponse.json({ ok: true, name: "Desk operator" });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      await createLegacyAdminSessionToken(secret),
      sessionCookieOptions(),
    );
    return response;
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
