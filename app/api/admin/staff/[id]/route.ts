import { requireAdmin } from "@/lib/admin-auth";
import { asBool, asOptionalString, asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/password";

export const dynamic = "force-dynamic";

function asRole(value: unknown) {
  return value === "OWNER" || value === "STAFF" ? value : undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  const { id } = await params;
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Admin user not found", 404);
  }

  const name = asString(parsed.data.name);
  const emailRaw = asOptionalString(parsed.data.email);
  const role = asRole(parsed.data.role);
  const active = asBool(parsed.data.active);
  const password = typeof parsed.data.password === "string" ? parsed.data.password : "";

  if (existing.role === "OWNER" && (role === "STAFF" || active === false)) {
    const owners = await prisma.adminUser.count({
      where: { role: "OWNER", active: true },
    });
    if (owners <= 1) {
      return jsonError("Keep at least one active owner account");
    }
  }

  let email: string | undefined;
  if (emailRaw) {
    if (!isValidEmail(emailRaw)) {
      return jsonError("Enter a valid email");
    }
    email = normalizeEmail(emailRaw);
  }

  if (password && password.length < 8) {
    return jsonError("Password must be at least 8 characters");
  }

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(role ? { role } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
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
    return jsonOk({ user });
  } catch (error) {
    return prismaError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  const { id } = await params;
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Admin user not found", 404);
  }
  if (existing.role === "OWNER" && existing.active) {
    const owners = await prisma.adminUser.count({
      where: { role: "OWNER", active: true },
    });
    if (owners <= 1) {
      return jsonError("Keep at least one active owner account");
    }
  }
  try {
    await prisma.adminUser.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return prismaError(error);
  }
}
