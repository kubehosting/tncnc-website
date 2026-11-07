import { jsonOk } from "@/lib/admin-api";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await requireCustomer(request);
  if (customer instanceof Response) {
    return customer;
  }
  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issuedAt: "desc" },
    take: 20,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalAmount: true,
      issuedAt: true,
    },
  });
  return jsonOk({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
    },
    invoices,
  });
}
