import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultAdmin() {
  if ((await prisma.adminUser.count()) > 0) {
    return;
  }
  const email = (process.env.ADMIN_OWNER_EMAIL || "kubendranath@tncnc.in").trim().toLowerCase();
  const password = process.env.ADMIN_OWNER_PASSWORD || "tncnc-owner-8chars";
  await prisma.adminUser.create({
    data: {
      name: "Kubendranath",
      email,
      passwordHash: await hashPassword(password),
      role: "OWNER",
      active: true,
    },
  });
}