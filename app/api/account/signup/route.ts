import { NextResponse } from "next/server";
import { asString, jsonError, prismaError, readJson } from "@/lib/admin-api";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerSessionToken,
  getSessionSecret,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/password";
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
  const name = asString(parsed.data.name);
  const emailRaw = asString(parsed.data.email);
  const phone = asString(parsed.data.phone);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";
  if (!name || !emailRaw || !isValidEmail(emailRaw)) {
    return jsonError("Name and a valid email are required");
  }
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters");
  }
  const email = normalizeEmail(emailRaw);

  try {
    const existing = await prisma.customer.findFirst({
      where: { email },
    });
    if (existing?.passwordHash) {
      return jsonError("An account with this email already exists. Sign in instead.", 409);
    }

    const passwordHash = await hashPassword(password);
    const customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name,
            phone: phone ?? existing.phone,
            passwordHash,
            lastLoginAt: new Date(),
          },
        })
      : await prisma.customer.create({
          data: {
            name,
            email,
            phone: phone ?? null,
            passwordHash,
            lastLoginAt: new Date(),
          },
        });

    const response = NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      await createCustomerSessionToken(secret, customer.id),
      sessionCookieOptions(CUSTOMER_SESSION_MAX_AGE, request),
    );
    return response;
  } catch (error) {
    return prismaError(error);
  }
}
