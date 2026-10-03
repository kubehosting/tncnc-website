import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk } from "@/lib/admin-api";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return jsonError(
      "Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env, or download the PDF and send it yourself.",
      503,
    );
  }

  const { id } = await params;
  const pdf = await buildInvoicePdf(id);
  if (!pdf) {
    return jsonError("Invoice not found", 404);
  }

  let to = pdf.invoice.customer.email ?? "";
  try {
    const body = (await request.json()) as { to?: unknown };
    if (typeof body.to === "string" && body.to.trim()) {
      to = body.to.trim();
    }
  } catch {
    // optional body
  }
  if (!to) {
    return jsonError("This customer has no email address");
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to,
    subject: `${pdf.invoice.invoiceNumber} from TNCNC`,
    text: `Please find invoice ${pdf.invoice.invoiceNumber} attached.`,
    attachments: [
      {
        filename: pdf.filename,
        content: Buffer.from(pdf.bytes),
        contentType: "application/pdf",
      },
    ],
  });

  return jsonOk({ ok: true, to });
}
