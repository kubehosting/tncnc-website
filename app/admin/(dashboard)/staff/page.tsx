import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { StaffManager } from "@/components/admin/staff-manager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin Users" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
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

  return (
    <>
      <AdminPageHeader
        title="Admin Users"
        description="Create named staff logins for the dashboard. You can still sign in with the desk API key if you leave the email field blank."
      />
      <StaffManager
        initial={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
