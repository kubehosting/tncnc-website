import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
import { company } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { invoiceInclude } from "@/lib/invoices";

function money(value: { toString(): string } | number) {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return `INR ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value);
}

export async function buildInvoicePdf(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: invoiceInclude,
  });
  if (!invoice) {
    return null;
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy: RGB = rgb(0.043, 0.11, 0.21);
  const gold: RGB = rgb(0.96, 0.77, 0);
  const muted: RGB = rgb(0.35, 0.4, 0.45);

  let y = 800;
  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 42, color: navy });
  page.drawText(company.name, { x: 40, y: 816, size: 16, font: bold, color: gold });
  page.drawText("TAX INVOICE", { x: 430, y: 816, size: 14, font: bold, color: rgb(1, 1, 1) });

  y = 770;
  const write = (text: string, x: number, size = 10, useBold = false, color = navy) => {
    page.drawText(text, { x, y, size, font: useBold ? bold : font, color });
  };

  write(company.tagline, 40, 9, false, muted);
  y -= 14;
  write(company.address, 40, 9, false, muted);
  y -= 14;
  write(`${company.phone}  ·  ${company.email}`, 40, 9, false, muted);

  y = 710;
  write(invoice.invoiceNumber, 40, 16, true);
  y -= 16;
  write(`Date: ${dateLabel(invoice.issuedAt)}`, 40, 10, false, muted);
  y -= 14;
  write(`Status: ${invoice.status}`, 40, 10, false, muted);

  y = 710;
  write("Bill to", 340, 9, true, muted);
  y -= 14;
  write(invoice.customer.name, 340, 11, true);
  if (invoice.customer.company) {
    y -= 14;
    write(invoice.customer.company, 340, 10, false, muted);
  }
  if (invoice.customer.address) {
    y -= 14;
    write(invoice.customer.address.slice(0, 48), 340, 10, false, muted);
  }
  if (invoice.customer.email) {
    y -= 14;
    write(invoice.customer.email, 340, 10, false, muted);
  }

  y = 600;
  page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 22, color: navy });
  page.drawText("Item", { x: 48, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: 330, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Rate", { x: 390, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Amount", { x: 480, y, size: 9, font: bold, color: rgb(1, 1, 1) });

  y -= 28;
  for (const item of invoice.items) {
    page.drawText(item.description.slice(0, 42), { x: 48, y, size: 10, font, color: navy });
    page.drawText(String(item.quantity), { x: 338, y, size: 10, font, color: navy });
    page.drawText(money(item.unitPrice), { x: 390, y, size: 10, font, color: navy });
    page.drawText(money(item.lineTotal), { x: 470, y, size: 10, font, color: navy });
    y -= 18;
  }

  y -= 10;
  const totalsX = 390;
  const rows = [
    ["Subtotal", money(invoice.subtotal)],
    [`GST (${invoice.taxRate.toString()}%)`, money(invoice.taxAmount)],
    ["Total", money(invoice.totalAmount)],
  ];
  for (const [label, value] of rows) {
    page.drawText(label, { x: totalsX, y, size: 10, font: label === "Total" ? bold : font, color: navy });
    page.drawText(value, { x: 470, y, size: 10, font: label === "Total" ? bold : font, color: navy });
    y -= 16;
  }

  y -= 20;
  if (invoice.notes) {
    page.drawText("Notes", { x: 40, y, size: 9, font: bold, color: muted });
    y -= 14;
    page.drawText(invoice.notes.slice(0, 90), { x: 40, y, size: 10, font, color: navy });
  }

  page.drawText("Thank you for your business.", {
    x: 40,
    y: 48,
    size: 9,
    font,
    color: muted,
  });
  page.drawText(company.website, { x: 430, y: 48, size: 9, font, color: muted });

  return {
    bytes: await doc.save(),
    filename: `${invoice.invoiceNumber}.pdf`,
    invoice,
  };
}
