import { requireAdmin } from "@/lib/admin-auth";
import {
  asOptionalString,
  asString,
  jsonError,
  jsonOk,
  prismaError,
  readJson,
} from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/password";

export const dynamic = "force-dynamic";

function asRole(value: unknown) {
  return value === "OWNER" || value === "STAFF" ? value : undefined;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return jsonOk({ users });
  } catch (error) {
    return prismaError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  const name = asString(parsed.data.name);
  const emailRaw = asString(parsed.data.email);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";
  const role = asRole(parsed.data.role) ?? "STAFF";
  if (!name || !emailRaw || !isValidEmail(emailRaw)) {
    return jsonError("Name and a valid email are required");
  }
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters");
  }
  const email = normalizeEmail(emailRaw);
  try {
    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return jsonOk({ user }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
