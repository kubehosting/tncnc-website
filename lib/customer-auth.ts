import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  getSessionSecret,
  parseCustomerSession,
  readCookie,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function getCustomerFromRequest(request: Request) {
  const parsed = await parseCustomerSession(
    readCookie(request, CUSTOMER_SESSION_COOKIE),
    getSessionSecret(),
  );
  if (!parsed) {
    return null;
  }
  return prisma.customer.findFirst({
    where: { id: parsed.customerId, passwordHash: { not: null } },
  });
}

export async function getCustomerFromCookies() {
  try {
    const jar = await cookies();
    const parsed = await parseCustomerSession(
      jar.get(CUSTOMER_SESSION_COOKIE)?.value,
      getSessionSecret(),
    );
    if (!parsed) {
      return null;
    }
    return prisma.customer.findFirst({
      where: { id: parsed.customerId, passwordHash: { not: null } },
    });
  } catch (error) {
    console.error("Could not read customer session.", error);
    return null;
  }
}

export async function requireCustomer(request: Request) {
  const customer = await getCustomerFromRequest(request);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return customer;
}
