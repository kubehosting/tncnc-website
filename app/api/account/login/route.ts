import { NextResponse } from "next/server";
import { asString, jsonError, readJson } from "@/lib/admin-api";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerSessionToken,
  getSessionSecret,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { isValidEmail, normalizeEmail, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = getSessionSecret();
  if (!secret) {
    return jsonError("Customer accounts are not configured", 503);
  }
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  const emailRaw = asString(parsed.data.email);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";
  if (!emailRaw || !isValidEmail(emailRaw) || !password) {
    return jsonError("Email and password are required");
  }
  const email = normalizeEmail(emailRaw);
  const customer = await prisma.customer.findFirst({
    where: { email },
  });
  if (!customer?.passwordHash || !(await verifyPassword(password, customer.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  const response = NextResponse.json({
    ok: true,
    customer: { id: customer.id, name: customer.name, email: customer.email },
  });
  response.cookies.set(
    CUSTOMER_SESSION_COOKIE,
    await createCustomerSessionToken(secret, customer.id),
    sessionCookieOptions(CUSTOMER_SESSION_MAX_AGE),
  );
  return response;
}
