import { NextResponse } from "next/server";
import { getAdminSecret } from "@/lib/admin-auth";
import { asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function keysMatch(provided: string, expected: string) {
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

  const deskKey = typeof parsed.data.deskKey === "string" ? parsed.data.deskKey : "";
  const emailRaw = asString(parsed.data.email);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";

  if (!deskKey || !keysMatch(deskKey, secret)) {
    return NextResponse.json({ error: "Desk key is incorrect" }, { status: 401 });
  }
  if (!emailRaw || !isValidEmail(emailRaw)) {
    return jsonError("Enter the admin email to reset");
  }
  if (password.length < 8) {
    return jsonError("New password must be at least 8 characters");
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: normalizeEmail(emailRaw) },
    });
    if (!user?.active) {
      return jsonError("No active admin user with that email", 404);
    }
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    return jsonOk({ ok: true, email: user.email });
  } catch (error) {
    return prismaError(error);
  }
}
