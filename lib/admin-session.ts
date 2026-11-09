const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "tncnc_admin_session";
export const CUSTOMER_SESSION_COOKIE = "tncnc_customer_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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

async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toHex(signature);
}

export function getSessionSecret() {
  return process.env.ADMIN_API_KEY?.trim() ?? "";
}

export async function createLegacyAdminSessionToken(secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = `v1.${issuedAt}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export async function createAdminUserSessionToken(secret: string, userId: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = `v2.admin.${userId}.${issuedAt}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export async function createCustomerSessionToken(secret: string, customerId: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = `v2.customer.${customerId}.${issuedAt}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export const createAdminSessionToken = createLegacyAdminSessionToken;

function ageOk(issuedAt: string, maxAge: number) {
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age < maxAge;
}

export async function parseAdminSession(
  token: string | undefined,
  secret: string | undefined,
): Promise<{ kind: "legacy" } | { kind: "user"; userId: string } | null> {
  if (!token || !secret) {
    return null;
  }
  const parts = token.split(".");
  if (parts[0] === "v1" && parts.length === 3) {
    const [version, issuedAt, signature] = parts;
    const expected = await sign(secret, `${version}.${issuedAt}`);
    if (!timingSafeEqual(signature, expected) || !ageOk(issuedAt, ADMIN_SESSION_MAX_AGE)) {
      return null;
    }
    return { kind: "legacy" };
  }
  if (parts[0] === "v2" && parts[1] === "admin" && parts.length === 5) {
    const [version, kind, userId, issuedAt, signature] = parts;
    const expected = await sign(secret, `${version}.${kind}.${userId}.${issuedAt}`);
    if (!timingSafeEqual(signature, expected) || !ageOk(issuedAt, ADMIN_SESSION_MAX_AGE)) {
      return null;
    }
    return { kind: "user", userId };
  }
  return null;
}

export async function isAdminSessionToken(
  token: string | undefined,
  secret: string | undefined,
) {
  return (await parseAdminSession(token, secret)) !== null;
}

export async function parseCustomerSession(
  token: string | undefined,
  secret: string | undefined,
): Promise<{ customerId: string } | null> {
  if (!token || !secret) {
    return null;
  }
  const parts = token.split(".");
  if (parts[0] !== "v2" || parts[1] !== "customer" || parts.length !== 5) {
    return null;
  }
  const [version, kind, customerId, issuedAt, signature] = parts;
  const expected = await sign(secret, `${version}.${kind}.${customerId}.${issuedAt}`);
  if (!timingSafeEqual(signature, expected) || !ageOk(issuedAt, CUSTOMER_SESSION_MAX_AGE)) {
    return null;
  }
  return { customerId };
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

function isHttpsRequest(request?: Request) {
  if (!request) {
    return false;
  }
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwarded === "https" || new URL(request.url).protocol === "https:";
}

// Dev previews load the site inside a cross-site iframe, where browsers drop
// SameSite=Lax cookies. Production keeps Lax for CSRF protection.
function baseCookieOptions(request?: Request) {
  if (process.env.NODE_ENV !== "production" && isHttpsRequest(request)) {
    return {
      httpOnly: true as const,
      sameSite: "none" as const,
      secure: true,
      partitioned: true,
      path: "/",
    };
  }
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function sessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE, request?: Request) {
  return { ...baseCookieOptions(request), maxAge };
}

export function clearCookieOptions(request?: Request) {
  return { ...baseCookieOptions(request), maxAge: 0 };
}
