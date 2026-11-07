import { asString, jsonError, jsonOk, prismaError, readJson } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readJson(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  const name = asString(parsed.data.name);
  const email = asString(parsed.data.email);
  const phone = asString(parsed.data.phone);
  const body = asString(parsed.data.message);
  if (!name || !email || !phone || !body) {
    return jsonError("name, email, phone, and message are required");
  }
  try {
    const enquiry = await prisma.enquiryMessage.create({
      data: {
        name,
        email,
        phone,
        body,
        source: asString(parsed.data.source) || "website",
      },
    });
    return jsonOk({ id: enquiry.id }, 201);
  } catch (error) {
    return prismaError(error);
  }
}
