import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, clearCookieOptions } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", clearCookieOptions(request));
  return response;
}
