import { jsonOk, prismaError } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }
  try {
    const messages = await prisma.enquiryMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ messages });
  } catch (error) {
    return prismaError(error);
  }
}
