import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSecret } from "@/lib/admin-auth";
import { ADMIN_SESSION_COOKIE, isAdminSessionToken } from "@/lib/admin-session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  let signedIn = false;
  try {
    signedIn = await isAdminSessionToken(token, getAdminSecret());
  } catch (error) {
    console.error("Admin session check failed.", error);
  }
  if (!signedIn) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
