import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasValidAdminAuth } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  getSessionSecret,
  isAdminSessionToken,
  parseCustomerSession,
} from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = getSessionSecret();
  const cookieAuthed = await isAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    secret,
  );
  const customerAuthed = Boolean(
    await parseCustomerSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value, secret),
  );

  if (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout" ||
    pathname === "/api/admin/reset-password" ||
    pathname === "/api/account/login" ||
    pathname === "/api/account/logout" ||
    pathname === "/api/account/signup"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (await hasValidAdminAuth(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/api/account")) {
    if (customerAuthed) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname === "/admin/login") {
    if (cookieAuthed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!cookieAuthed) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname === "/account/login" || pathname === "/account/signup") {
    if (customerAuthed) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    if (!customerAuthed) {
      const login = new URL("/account/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/account",
    "/account/:path*",
    "/api/account/:path*",
  ],
};
