import { InvoiceStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, prismaError } from "@/lib/admin-api";
import { asInvoiceStatus, finalizeInvoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  let nextStatus: InvoiceStatus = InvoiceStatus.PENDING;
  try {
    const body = (await request.json()) as { status?: unknown };
    const requested = asInvoiceStatus(body.status);
    if (requested && requested !== InvoiceStatus.DRAFT) {
      nextStatus = requested;
    }
  } catch {
    nextStatus = InvoiceStatus.PENDING;
  }

  try {
    const invoice = await finalizeInvoice(id, nextStatus);
    return jsonOk({ invoice });
  } catch (error) {
    if (error instanceof Error && /stock|inventory|Draft/i.test(error.message)) {
      return jsonError(error.message, 409);
    }
    return prismaError(error);
  }
}
