import { amount } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getAdminOverview() {
  const since30 = daysAgo(30);

  const [
    pendingOrders,
    processingOrders,
    completedOrders,
    productCount,
    customerCount,
    postCount,
    newCustomers,
    sales30,
    salesAll,
    recentOrders,
    recentCustomers,
    popularProducts,
  ] = await Promise.all([
    prisma.invoice.count({ where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.machine.count(),
    prisma.customer.count(),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.customer.count({ where: { createdAt: { gte: since30 } } }),
    prisma.invoice.count({
      where: { status: "PAID", issuedAt: { gte: since30 } },
    }),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.customer.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.machine.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = await prisma.invoice.aggregate({
    where: { status: { not: "DRAFT" }, issuedAt: { gte: monthStart } },
    _sum: { totalAmount: true },
  });

  return {
    pendingOrders,
    processingOrders,
    completedOrders,
    productCount,
    customerCount,
    postCount,
    newCustomers,
    sales30,
    salesAll,
    monthRevenue: amount(monthRevenue._sum.totalAmount),
    recentOrders,
    recentCustomers,
    popularProducts,
  };
}
