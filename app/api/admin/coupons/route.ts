import { asInt, asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ coupons });
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
  const code = asString(parsed.data.code);
  const percent = asInt(parsed.data.percent);
  if (!code || percent === undefined) {
    return jsonError("code and percent are required");
  }
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        percent,
        active: parsed.data.active !== false,
        note: asString(parsed.data.note) ?? null,
      },
    });
    return jsonOk({ coupon }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
